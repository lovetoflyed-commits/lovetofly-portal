#!/bin/bash
# Open Test Reports in Default Browser

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Open the index.html file with the default browser
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open "$SCRIPT_DIR/index.html"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open "$SCRIPT_DIR/index.html"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    # Windows (Git Bash)
    start "$SCRIPT_DIR/index.html"
else
    echo "Unable to detect OS. Please open the following file manually:"
    echo "$SCRIPT_DIR/index.html"
fi

echo "Opening test reports portal..."
