<h1 align="center">
  <br>
  <a href="https://stickmanred.github.io/wick-editor/"><img src=".github/images/logo.svg" alt="Wick Editor" width="25%"></a>
  <br>
</h1>
<h1>Wick Editor</h1>


The Wick Editor is a free and open-source tool for creating games, animations, and everything in-between. It's designed to be the most accessible tool for creating multimedia projects on the web.
<p align="center"><img width="100%" src="https://github.com/user-attachments/assets/305b2b54-82a5-49d4-b036-2c496fb2befe"></p>

## Getting started

These should work if you have the dependencies & requirements.

### Requirements

You'll need to download the following:

- [NodeJS 14](https://nodejs.org/en/download) (**NOTE: This is a acient version of NodeJS, from the acient times**)
- [NodeJS 14 from `scoop`](https://scoop.sh/#/apps?q=nodejs14&id=ad5eddce0b1705a4141b06f972d326a2aaf03d4c) (Great package manager for people who don't wanna install stuff using wonky installers)
- [Git](https://git-scm.com/downloads) (**NOTE: This is the single-most important tool you need. You can also use VSCode's Git, but you won't be able to use it with the ZIP option.**)
### Installation

1) Clone this repository:

    ```bash
    git clone https://github.com/StickmanRed/wick-editor.git
    ```

2) Using the command line, change directories into the newly created `wick-editor` folder:

    ```bash
    cd wick-editor
    ```

3) Install all dependencies using this command:

    ```bash
    npm install
    ```

### Running the Editor

1) Run the editor with this command:

    ```bash
    npm start
    ```

2) Open a web browser and go to this URL:

    ```
    localhost:3000
    ```
    (**NOTE: It may open up itself once `npm start` is ran**).

Have fun hacking on Wick! 🎉

### Deploying to Production

To deploy, you'll need to have push access to this repo.

1) Test the production build by using `npm predeploy`

2) Run `npm run deploy`

### Deploying to Prerelease

1) Run `npm run prerelease-deploy`

## License

Wick Editor is under the GNU v3 Public License. See the [LICENSE](LICENSE.md) for more information.

## Made by:
<a href="https://github.com/StickmanRed/wick-editor/graphs/contributors">
	<img src = "https://contrib.rocks/image?repo=StickmanRed/wick-editor"/>
</a>
