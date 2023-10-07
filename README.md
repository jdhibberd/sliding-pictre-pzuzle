# Sliding Pictre Pzuzle

A simple sliding picture puzzle written in JavaScript.

[![Video](https://img.youtube.com/vi/lIeSvnA4-NU/hqdefault.jpg)](https://www.youtube.com/embed/lIeSvnA4-NU)

After having not programmed in JavaScript for many years I decided to get back into it, and see where the language had evolved to. I read the excellent _JavaScript - The Definitive Guide_ by David Flanagan and wrote this simple sliding picture puzzle to put into practice some of what I'd read.

## To play

Just download `build\sliding-pictre-pzuzle.html` and run it locally in a browser.

Because it uses ES6 syntax you should use a modern browser, like Chrome (I wanted to avoid having to deal with transpilers).

## To develop

The entire game consists of only 3 files (HTML, CSS, and JavaScript), all found in `src`. Make modifications to any of these files then run `node build.js` to rebuild the "HTML" file bundle in `dist`.
