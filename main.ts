import { parse } from "https://deno.land/std/flags/mod.ts";
import { config } from "https://deno.land/x/dotenv/mod.ts";
import { OpenAI } from 'https://deno.land/x/openai/mod.ts';
import { Confirm } from "https://deno.land/x/cliffy/prompt/confirm.ts";
import { Select } from "https://deno.land/x/cliffy/prompt/select.ts";
import chalk from "https://deno.land/x/chalk_deno@v4.1.1-deno/source/index.js";
import { TerminalSpinner } from "https://deno.land/x/spinners/mod.ts";


const HELP_MESSAGE = `
Usage: deno run --allow-net --allow-read --allow-run --allow-env main.ts [options] [dir]

Options:
  -h, --help     Show this help message and exit
  -d, --dir      Directory where to perform the diff (default: current directory)
`;

const args = parse(Deno.args, {
    alias: { h: "help", d: "dir" },
    boolean: ["help", "debug"],
    string: ["dir"],
});

if (args.help) {
    console.log(HELP_MESSAGE);
    Deno.exit(0);
}

const directory = args.dir || Deno.cwd();
const openaiApiKeyFromEnv = Deno.env.get("OPENAI_API_KEY");
const modelVersionFromEnv = Deno.env.get("MODEL_VERSION");
const numCommitMessagesFromEnv = Deno.env.get("NUM_COMMIT_MESSAGES");

const { OPENAI_API_KEY, MODEL_VERSION, NUM_COMMIT_MESSAGES } = {
    OPENAI_API_KEY: openaiApiKeyFromEnv || config().OPENAI_API_KEY,
    MODEL_VERSION: modelVersionFromEnv || config().MODEL_VERSION,
    NUM_COMMIT_MESSAGES: numCommitMessagesFromEnv || config().NUM_COMMIT_MESSAGES,
};

const openai = new OpenAI(OPENAI_API_KEY);

if (!OPENAI_API_KEY) {
    console.error("Error: OPENAI_API_KEY not found in .env file.");
    Deno.exit(1);
}

async function getDiff(): Promise<string> {
    const cmd = Deno.run({
        cmd: ["git", "diff", "--unified=0"],
        cwd: directory,
        stdout: "piped",
        stderr: "piped",
    });

    const output = await cmd.output();
    const error = await cmd.stderrOutput();
    const status = await cmd.status();

    if (!status.success) {
        console.error(new TextDecoder().decode(error));
        Deno.exit(1);
    }

    return new TextDecoder().decode(output);
}

function hasChanges(diff: string): boolean {
    return diff.trim().length > 0;
}

async function getCommitMessages(diff: string): Promise<{ value: string; name: string; }[]> {
    const terminalSpinner = new TerminalSpinner("Getting commits from OpenAI...");
    terminalSpinner.start();

    const response = await openai.createChatCompletion({
        model: MODEL_VERSION,
        messages: [{ role: "user", content: `Suggest ${NUM_COMMIT_MESSAGES} Git commit messages for the following diff:\n\n${diff}` }],
    });
    terminalSpinner.succeed("Commits fetched from OpenAI!");

    if (!response.choices || response.choices.length === 0) {
        console.error(chalk.red("Error: Unexpected response from OpenAI API. Please try running the tool again."));
        if (args.debug) {
            console.error(chalk.red("Debug information:"));
            console.error(response);
        }
        Deno.exit(1);
    }

    const messages = response.choices[0].message.content.trim().split('\n');
    return messages.map((message) => {
        const value = message.replace(/^\d+\. /, '');
        return { value: value, name: message };
    });
}

async function commitWithMessage(message: string) {
    // Stage all changes in the working directory
    await Deno.run({
        cmd: ["git", "add", "."],
        cwd: directory,
        stdout: "piped",
        stderr: "piped",
    }).status();

    // Commit staged changes with the provided message
    const cmd = Deno.run({
        cmd: ["git", "commit", "-m", message],
        cwd: directory,
        stdout: "piped",
        stderr: "piped",
    });

    const output = await cmd.output();
    const error = await cmd.stderrOutput();
    const status = await cmd.status();

    if (!status.success) {
        console.error(new TextDecoder().decode(error));
        Deno.exit(1);
    }

    console.log(new TextDecoder().decode(output));
}

async function selectCommitMessage(commitMessages: { value: string; name: string; }[]): Promise<string | null> {
    const options = [
        ...commitMessages,
        {
            value: "refresh",
            name: chalk.blue("Get more commit messages..."),
        },
    ];

    const selectedMessage = await Select.prompt({
        message: chalk.bold.yellow("Select a commit message:"),
        options: options,
    });

    return selectedMessage === "refresh" ? null : selectedMessage;
}


(async () => {
    try {
        const diff = await getDiff();

        if (!hasChanges(diff)) {
            console.log(chalk.yellow("No changes detected. Exiting."));
            Deno.exit(0);
        }

        let commitMessages = await getCommitMessages(diff);
        let selectedMessage: string | null;

        do {
            selectedMessage = await selectCommitMessage(commitMessages);
            if (selectedMessage === null) {
                commitMessages = await getCommitMessages(diff);
            }
        } while (selectedMessage === null);

        console.log(chalk.green("Selected commit message:"), selectedMessage);

        const confirmation = await Confirm.prompt({
            message: chalk.bold.yellow(`Do you want to commit with the message "${selectedMessage}"?`),
            default: "y",
            type: "confirm",
        });

        if (confirmation) {
            await commitWithMessage(selectedMessage);
            console.log(chalk.green(`Committed with message: "${selectedMessage}"`));
        } else {
            console.log(chalk.red("Commit canceled."));
        }
    } catch (error) {
        console.error(chalk.red("Error:"), error.message);
    }
})();