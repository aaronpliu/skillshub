# Skills Hub CLI Guide

The Skills Hub CLI allows you to browse, search, and install skills directly from the command line. It works on any system with Node.js 18+ and requires no additional dependencies.

## Installation

### Download from your Skills Hub server

```bash
# Download the CLI
curl -o skills-hub https://your-skills-hub.example.com/api/cli

# Make it executable
chmod +x skills-hub

# Move to a directory in your PATH
sudo mv skills-hub /usr/local/bin/
```

Verify the installation:

```bash
skills-hub --version
```

### Alternative: Local development

If you're working in the Skills Hub repository:

```bash
# Run directly with node
node cli/index.js --help

# Or via npm script
npm run cli -- --help
```

## Authentication

Before using skill commands, you need to authenticate with your organization's Skills Hub server.

### Login

```bash
skills-hub auth login \
  -u https://your-skills-hub.example.com \
  -o your-org-slug \
  -e your@email.com \
  -p your-password
```

**Options:**
- `-u, --url <url>` — Skills Hub server URL (default: `http://localhost:3000`)
- `-o, --org <slug>` — Your organization's slug (e.g., `acme-corp`)
- `-e, --email <email>` — Your email address
- `-p, --password <password>` — Your password

**What happens:**
- The CLI authenticates with the server and receives an API token
- Credentials are stored in `~/.skills-hub/config.json`
- The token is used for all subsequent API calls

### Check authentication status

```bash
skills-hub auth status
```

Output:
```
✓ Authenticated
  Server: https://your-skills-hub.example.com
  Organization: acme-corp
```

### Logout

```bash
skills-hub auth logout
```

Clears stored credentials from `~/.skills-hub/config.json`.

## Using Skills

### List available skills

```bash
skills-hub skill list
```

Output:
```
  Skills (12 total)

  ID        Name                    Status     Installs  Versions
  ────────  ──────────────────────  ─────────  ────────  ────────
  a1b2c3d4  Code Review             published  45        3
  e5f6g7h8  API Documentation       published  32        2
  ...
```

**Options:**
- `-q, --query <search>` — Search query (e.g., `"code review"`)
- `--page <n>` — Page number (default: 1)
- `--limit <n>` — Results per page (default: 20)

### Search for skills

```bash
skills-hub skill list -q "code review"
```

### View skill details

```bash
skills-hub skill info <skill-id>
```

Example:
```bash
skills-hub skill info a1b2c3d4
```

Output:
```
  Skill: Code Review
  ────────────────────────────────────────
  ID:           a1b2c3d4-e5f6-7890-abcd-ef1234567890
  Description:  Automated code review skill for...
  Status:       published
  Visibility:   organization
  Category:     Development
  Tags:         code-review, quality, automation
  Installs:     45
  Created:      1/15/2025
  Updated:      2/20/2025
```

### Install a skill

```bash
skills-hub skill install <skill-id>
```

**Options:**
- `-o, --output <dir>` — Output directory (default: `.skills`)
- `--version <version>` — Install a specific version

**What happens:**
1. The CLI fetches the skill content from the server
2. The install is recorded in the database (tracks who installed what)
3. A `SKILL.md` file is created in the output directory

Example:
```bash
skills-hub skill install a1b2c3d4 -o ~/.skills
```

Output:
```
  Fetching skill...
  ✓ Skill installed to /Users/you/.skills/Code Review
  Version: 1.2.0
  Package hash: sha256:abc123...
  Install recorded ✓
```

The skill is now available as `~/.skills/Code Review/SKILL.md`.

### Install a specific version

```bash
skills-hub skill install a1b2c3d4 --version 1.1.0
```

## How skill installation works

When you install a skill:

1. **Authentication** — The CLI sends your API token to the server
2. **Content retrieval** — The server returns the skill's `SKILL.md` content directly in the API response (works in any deployment: local, Docker, Kubernetes)
3. **Install tracking** — The server records the install in the `SkillInstall` table and increments the install count
4. **Audit logging** — The install is logged for compliance and security tracking
5. **Local storage** — The CLI writes the `SKILL.md` file to your specified directory

The skill content is delivered via the API, so you don't need direct access to the storage backend (S3/RustFS).

## Configuration file

The CLI stores configuration in `~/.skills-hub/config.json`:

```json
{
  "serverUrl": "https://your-skills-hub.example.com",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "orgSlug": "acme-corp"
}
```

**Security note:** This file contains your API token. Keep it secure and don't commit it to version control.

## Troubleshooting

### "Not authenticated" error

```bash
Error: Not authenticated. Run 'skills-hub auth login' first.
```

**Solution:** Run `skills-hub auth login` with your credentials.

### "Invalid credentials" error

```bash
✗ Login failed: Invalid credentials
```

**Solution:** Check your email, password, and organization slug. Make sure your account is active.

### "Request failed (401)" error

Your token may have expired. Log in again:

```bash
skills-hub auth logout
skills-hub auth login -u <url> -o <org> -e <email> -p <password>
```

### Command not found

If `skills-hub` is not found after installation:

1. Make sure the file is executable: `chmod +x /usr/local/bin/skills-hub`
2. Make sure `/usr/local/bin` is in your PATH: `echo $PATH`
3. Or move it to a directory in your PATH

### Node.js version

The CLI requires Node.js 18 or later (uses built-in `fetch`). Check your version:

```bash
node --version
```

## Examples

### Complete workflow

```bash
# 1. Install the CLI
curl -o skills-hub https://hub.example.com/api/cli
chmod +x skills-hub
sudo mv skills-hub /usr/local/bin/

# 2. Authenticate
skills-hub auth login \
  -u https://hub.example.com \
  -o acme-corp \
  -e alice@acme.com \
  -p ******

# 3. Browse skills
skills-hub skill list
skills-hub skill list -q "documentation"

# 4. View details
skills-hub skill info abc123

# 5. Install a skill
skills-hub skill install abc123 -o ~/.skills

# 6. Use the skill
# The skill is now available at ~/.skills/<skill-name>/SKILL.md
```

### CI/CD integration

Use the CLI in automated workflows:

```yaml
# .github/workflows/skill-update.yml
name: Update Skills
on:
  schedule:
    - cron: '0 0 * * 1'  # Weekly

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - name: Install CLI
        run: |
          curl -o skills-hub https://hub.example.com/api/cli
          chmod +x skills-hub
          sudo mv skills-hub /usr/local/bin/

      - name: Authenticate
        run: |
          skills-hub auth login \
            -u https://hub.example.com \
            -o ${{ secrets.ORG_SLUG }} \
            -e ${{ secrets.EMAIL }} \
            -p ${{ secrets.PASSWORD }}

      - name: Install skills
        run: |
          skills-hub skill install <skill-id> -o ./skills
```

## Command reference

| Command | Description |
|---------|-------------|
| `skills-hub auth login` | Authenticate with the server |
| `skills-hub auth status` | Show authentication status |
| `skills-hub auth logout` | Clear stored credentials |
| `skills-hub skill list` | List available skills |
| `skills-hub skill info <id>` | Show skill details |
| `skills-hub skill install <id>` | Install a skill locally |

Run `skills-hub --help` for full usage information.
