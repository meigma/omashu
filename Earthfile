VERSION 0.7

nix:
    FROM debian:bookworm-slim
    ARG user=user
    ARG uid=1000
    ARG gid=$uid

    # Install Nix dependencies
    RUN apt-get update && apt-get upgrade -y && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        sudo \
        xz-utils

    # Nix doesn't like being run as root, so we create a user to run it
    RUN groupadd -g $gid $user && \
        useradd -u $uid -g $gid -G sudo -m $user -s /bin/bash

    # Setup sudo (used by the installer) and enable flakes
    RUN sed -i 's/%sudo.*ALL/%sudo   ALL=(ALL:ALL) NOPASSWD:ALL/' /etc/sudoers && \
        echo "sandbox = false" > /etc/nix.conf && \
        echo "experimental-features = nix-command flakes" >> /etc/nix.conf

    # Install Nix
    USER $user
    ENV USER=${USER}
    ENV NIX_PATH=/home/${USER}/.nix-defexpr/channels:/nix/var/nix/profiles/per-user/root/channels
    ENV NIX_CONF_DIR /etc
    RUN curl -L 'https://nixos.org/nix/install' | NIX_INSTALLER_NO_MODIFY_PROFILE=1 sh

devshell:
    FROM +nix
    ARG user=user
    ENV USER=$user

    # Copy the devshell and dump the environment
    WORKDIR /devshell

    COPY flake.nix flake.lock .
    RUN bash -c "source /home/$user/.nix-profile/etc/profile.d/nix.sh && nix print-dev-env --accept-flake-config --impure >.env"

    # Create a simplified script for executing within the devshell
    RUN echo '#!/usr/bin/env bash' >>with_nix && \
        echo 'source /devshell/.env >/dev/null 2>&1' >>with_nix && \
        echo 'exec "$@"' >>with_nix && \
        chmod +x with_nix && \
        sudo ln -s /devshell/with_nix /usr/bin/with_nix