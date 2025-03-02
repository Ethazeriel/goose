# Goose
**(a discord bot, for now)**

### Running
The supported way to run the bot is via docker. A prebuilt image is not provided at this time; to run the project, do the following:

1. Clone this repository.
2. Build the docker image - `docker build -t goosebot .`
3. follow the instructions in the config directory to create a config file and cookies.
4. Start the project with the provided compose file - `docker compose up -d`

### Updating
// TODO - expand, explain

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