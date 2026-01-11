# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly.

**Do not open a public GitHub issue for security vulnerabilities.**

Instead, please send an email to the repository maintainer or use GitHub's private vulnerability reporting feature:

1. Go to the [Security tab](https://github.com/josh-fisher/datto-rmm/security)
2. Click "Report a vulnerability"
3. Provide details about the vulnerability

### What to include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response timeline

- **Acknowledgment**: Within 48 hours
- **Initial assessment**: Within 7 days
- **Resolution target**: Within 30 days (depending on severity)

## Security Best Practices

When using this project:

### API Credentials

- Never commit API keys or secrets to version control
- Use environment variables for all sensitive configuration
- Rotate credentials regularly
- Use the minimum required permissions for API keys

### MCP Server

- Only run the MCP server in trusted environments
- Review tool permissions before enabling in AI assistants
- Monitor API usage through Datto RMM's activity logs

### Dependencies

- Keep dependencies up to date
- Review Dependabot alerts promptly
- Audit new dependencies before adding them

## Scope

This security policy applies to:

- `datto-rmm-api` npm package
- `datto-rmm-mcp-server` npm package
- `datto-api` Rust crate
- This GitHub repository

Third-party dependencies and the Datto RMM API itself are outside the scope of this policy.
