# Uyjhmn n
 interpreter for [Truttle1](https://esolangs.org/wiki/User:Truttle1)'s esolang.
 Documentation: [video link](https://www.youtube.com/watch?v=2_-D1GLEs-8&pp=ygUIdXlqaG1uIG4%3D), [Esolangs wiki page](https://esolangs.org/wiki/Uyjhmn_n).

Interpreter for uyjhmn n that comes with a compression tool.
Many ways to use these:

# Usage
## interpreter.mjs
interpreter.mjs is the main file. there are many ways to call this using node:


```
node interpreter.mjs
```
will just attempt to open code.txt in the same directory.


```
node interpreter.mjs [PATH]
```
will open the file in the specified path.


```
node interpreter.mjs --direct <code>
```
will directly take a compressed code in the command line.

You can use the `--no-decompression` ( or `-nd` ) and `--force-decompression` ( or `-fd` ) flags to make the program decompress the code if not detected automatically, or make it not decompress the code if it causes issues.

## compress.js
This optional program gives you the ability to compress your codes for sharing. Usage:

```
node compress.js [input-path] [output-path]
```
input-path defaults to `./code.txt`, and output-path defaults to `./code_compressed.txt`. The resulting output will also be printed to console. you can paste the code and share it! other people can use the   ``--direct <CODE>`` flag to automatically decompress and run it. it will automatically make a file called `decompressed_code.uyj` with the decompressed version