# Goose
**(a discord bot, for now)**

## Features

 - Pride stickers
 - Music player:
    - control via web interface or discord slash commands
    - all the functions you'd expect from a music player- play/pause, seeking, shuffle (including album aware), playlists (import, edit, save, etc.)
    - supports importing music from multiple platforms:
      - youtube (playback capable)
      - spotify
      - napster
      - subsonic (playback capable)
 - live chat translation through google translate api
 - designed for self hosting - don't trust someone else with the entire contents of your servers, get your own api keys and own your own data


### Running
This repository contains everything you need to run the bot on bare metal, but the recommended method is via docker. A prebuilt image is not provided at this time; to run the project, do the following:

1. Clone this repository.
2. Build the docker image - `docker build -t goosebot .`
3. follow the instructions in the config directory to create a config file and export cookies (for youtube).
4. Start the project with the provided compose file - `docker compose up -d`

### Updating
There's really nothing to this aside from a git pull, but if you're running via docker it's important to also remove the volumes that are created by the default compose file.

1. `docker compose down -v`
2. `git pull origin main`
3. `docker compose up -d`

🐎

This work is licensed under a
[Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License][cc-by-nc-sa].

[![CC BY-NC-SA 4.0][cc-by-nc-sa-image]][cc-by-nc-sa]

[cc-by-nc-sa]: http://creativecommons.org/licenses/by-nc-sa/4.0/
[cc-by-nc-sa-image]: https://licensebuttons.net/l/by-nc-sa/4.0/88x31.png
[cc-by-nc-sa-shield]: https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg