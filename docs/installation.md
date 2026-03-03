# Installation

## Cargo (Recommended)

```bash
cargo install etalon-cli
cargo install etalon-mcp-server  # Optional: for AI agent integration
```

## Docker

```bash
docker run --rm -v $(pwd):/workspace ghcr.io/nma-vc/etalon audit /workspace
```

## Pre-built Binaries

Download the latest release for your platform from [GitHub Releases](https://github.com/NMA-vc/etalon/releases):

| Platform | Binary |
|----------|--------|
| Linux (x86_64) | `etalon-linux-amd64` |
| macOS (Apple Silicon) | `etalon-macos-arm64` |
| Windows (x86_64) | `etalon-windows-amd64.exe` |

```bash
# Example: Linux
curl -L https://github.com/NMA-vc/etalon/releases/latest/download/etalon-linux-amd64 -o etalon
chmod +x etalon
sudo mv etalon /usr/local/bin/
```

## Build from Source

```bash
git clone https://github.com/NMA-vc/etalon.git
cd etalon
cargo build --release -p etalon-cli
# Binary at: target/release/etalon-cli
```

## Verify Installation

```bash
etalon --version
etalon info
```
