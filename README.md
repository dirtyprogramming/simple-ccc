# simple-ccc
Un client simple et épuré pour Coco

# Installation et utilisation
Le plus simple est de télécharger l'application depuis la page [releases](https://github.com/dirtyprogramming/simple-ccc/releases) et de lancer l'éxécutable.
___

1. Télécharger l'ensemble des fichers du git, ou bien le cloner :<br />
`git clone https://github.com/dirtyprogramming/simple-ccc.git`<br />
se déplacer dans le dossier : `cd simple-ccc`<br />
puis installer les dépendances : `npm install`

Il est tout à fait possible de s'arrêter là pour utiliser simple-ccc. Pour cela, il suffit de lancer `node server.js` et de se rendre sur `localhost:8080`. Certaines fonctionnalités directement issues d'Electron ne seront en revanche pas disponibles.

2. À l'aide de la commande [electron-packager](https://github.com/electron-userland/electron-packager) il faut empaqueter l'application (l'ensemble des fichiers) :<br />
`electron-packager chemin_simple-ccc app_simple-cc --platform=<platform> --arch=<arch>`

L'argument _platform_ peut prendre comme valeur : `darwin` (Mac), `linux`, `win32` (Windows).<br />
L'argument _arch_ peut prendre comme valeur : `ia32` (32bits), `x64` (64 bits), `armv7l`, `arm64`, `mips64el`...<br />
Ainsi pour un empaquement pour Windows 64bits :<br />`electron-packager simple-ccc app_simple-ccc --platform=win32 --arch=x64`

Si une erreur concernant la version Electron à utiliser est retournée, il faut ajouter l'option : <br />
`--electron-version=1.6.2`

3. Il suffit ensuite de lancer l'exécutable _simple-ccc_ à l'intérieur du dossier app_simple-cc.
