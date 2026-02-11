# GitHub Copilot Troubleshooting Guide

## Network Error: ERR_FAILED

If you're experiencing network errors with GitHub Copilot (e.g., `net::ERR_FAILED`), follow these steps:

### 1. Check Network Connectivity

Test if you can reach Copilot services:
```bash
curl --verbose https://copilot-proxy.githubusercontent.com/_ping
```

A working connection will respond with HTTP 200.

### 2. Verify VS Code Settings

The `.vscode/settings.json` file includes proper Copilot configuration:

- `github.copilot.enable`: Controls Copilot by language
- `github.copilot.advanced`: Proxy override settings for debugging
- `http.proxyStrictSSL`: SSL verification for proxy connections

### 3. Proxy Configuration

If you're behind a corporate proxy, you may need to configure:

1. Open VS Code Settings (Ctrl+, or Cmd+,)
2. Search for "proxy"
3. Set `http.proxy` to your proxy address (e.g., `http://proxy.company.com:8080`)
4. If you have certificate issues, temporarily set `http.proxyStrictSSL` to `false` (note: less secure)

### 4. Firewall Settings

Ensure your firewall allows access to:
- `https://github.com`
- `https://api.githubcopilot.com`
- `https://copilot-proxy.githubusercontent.com`

### 5. Re-authenticate

1. Sign out of GitHub in VS Code: Press F1, type "GitHub: Sign out"
2. Restart VS Code
3. Sign back in: Press F1, type "GitHub: Sign in"

### 6. Extension Updates

Ensure VS Code and GitHub Copilot extension are up to date:
1. Open Extensions (Ctrl+Shift+X or Cmd+Shift+X)
2. Check for updates to GitHub Copilot
3. Update VS Code to the latest version

### 7. Diagnostics

View diagnostic logs:
- Press F1 and run "GitHub Copilot: Show Output" or "Developer: Show Logs"
- Check the "GitHub Copilot" output channel for errors

### 8. Alternative Network

If possible, test with a different network (e.g., mobile hotspot) to confirm if the issue is network-related.

## Additional Resources

- [GitHub Docs: Troubleshooting network errors](https://docs.github.com/en/copilot/how-tos/troubleshoot-copilot/troubleshoot-network-errors)
- [GitHub Docs: Configure network settings](https://docs.github.com/en/copilot/how-tos/configure-personal-settings/configure-network-settings?tool=vscode)
- [GitHub Docs: Troubleshooting firewall settings](https://docs.github.com/en/copilot/how-tos/troubleshoot-copilot/troubleshoot-firewall-settings)

## Still Having Issues?

If you've tried all the above steps and still experiencing issues:
1. Check if your organization has specific Copilot policies
2. Contact your IT administrator for network access
3. Report the issue with diagnostic logs to GitHub Support
