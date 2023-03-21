# Git Commit Message Generator

This script generates a Git commit message based on a diff using OpenAI's GPT-4. It uses Deno for running the script.

## Prerequisites

- [Deno](https://deno.land/) installed
- [OpenAI API key](https://beta.openai.com/signup/)

## Installation

1. Clone this repository:

```bash
git clone https://github.com/Fulviuus/git-commit-generator 
cd git-commit-generator 
```

2. Create a `.env` file in the root directory of the project and add your OpenAI API key and configuration:

```ini
OPENAI_API_KEY=your_openai_api_key_here
MODEL_VERSION=gpt-4
NUM_COMMIT_MESSAGES=3
```

## Usage

Run the script in a Git repository to generate a commit message based on the current diff:

```bash
deno run --allow-net --allow-read --allow-run --allow-env main.ts
```

You can also specify a directory where the Git repository is located:

```bash
deno run --allow-net --allow-read --allow-run --allow-env main.ts -d /path/to/your/repo
```

## Options

- `-h, --help`: Show the help message and exit
- `-d, --dir`: Directory where to perform the diff (default: current directory)
- `--debug`: Show debug information

## Example

```bash
$ deno run --allow-net --allow-read --allow-run --allow-env main.ts
Update README.md with installation instructions
```
## Running the script globally using an alias in .bashrc

To run the script globally on your system, you can add an alias in your `.bashrc` file.

1. Open your `.bashrc` file located in your home directory:

```bash
nano ~/.bashrc
```

2. Add the following line to the end of the file, replacing `/path/to/your-repo/main.ts` with the actual path to the `main.ts` file in your repository:

```bash
alias commitgen='deno run --allow-net --allow-read --allow-run --allow-env /path/to/your-repo/main.ts'
```

3. Add the following environment variables to the file:

```bash
export OPENAI_API_KEY=yout_openai_api_key_here
export MODEL_VERSION=gpt-4
export NUM_COMMIT_MESSAGES=3
 ```

4. Save the file and exit the editor.

5. Reload your `.bashrc` file by running:

```bash
source ~/.bashrc
```

Now you can use the `commitgen` command from any directory to generate a commit message based on the current diff:

```bash
commitgen
```

If you want to specify a directory where the Git repository is located, you can still use the `-d` option:

```bash
commitgen -d /path/to/your/repo
```

## Compiling the script

You can also compile the Deno script into a standalone executable binary, so you don't need to run it through the Deno runtime.

1. Compile the script:

```bash
deno compile --allow-net --allow-read --allow-run --allow-env -o commitgen main.ts
```

This will create a binary called `commitgen`.

2. Move the binary to a directory in your `$PATH`, like `/usr/local/bin`:

```bash
sudo mv commitgen /usr/local/bin/
```

3. Make sure the binary is executable:

```bash
sudo chmod +x /usr/local/bin/commitgen
```

4. Add the following environment variables to your `.bashrc` file:

```bash
export OPENAI_API_KEY=yout_openai_api_key_here
export MODEL_VERSION=gpt-4
export NUM_COMMIT_MESSAGES=3
 ```

Now you can use the `commitgen` command from any directory to generate a commit message based on the current diff:

```bash
commitgen
```

If you want to specify a directory where the Git repository is located, you can still use the `-d` option:

```bash
commitgen -d /path/to/your/repo
```

## License

This code is licensed under the [MIT License](https://opensource.org/licenses/MIT).
