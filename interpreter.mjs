import fs from 'fs'
import readline from 'readline'

function decompress(input) {
    if (/^UYJ[1-2]_/.test(input)) {
		const ver = input[3];
        input = atob(input.slice(5));

        //code = code.replace(/([^\r\n]{40})\r?\n/g,'$1');
        if([,/\x1b[i-z]|\x1c[4-z]/,/\x1b[l-z]|\x1c[5-z]/][ver].test(input)) {
            console.error("\x1b[31mUnsupported compression flags for format UYJ_%s\x1b[0m",ver);
			return null;
        }
        // code = code.replace(/\x1c1([\w_!@#$%^&*()+=]+)\n\x1c0(-?\d+)/g,'\x1c3$1\x1d$2')
        input = input.replace(/\x1c3([\w_!@#$%^&*()+=]+)\x1d(-?\d+)/g, '\x1c1$1\n\x1c0$2')

        input = input.replace(/\x1c0(-?\d+)/g, '\x1b3$1\x1b4');
        input = input.replace(/\x1c1([\w_!@#$%^&*()+=]+)/g, '\x1b1$1\n\x1b2$1');
        input = input.replace(/\x1c2([\w_!@#$%^&*()+=]+)\x1d([\w_!@#$%^&*()+=]+)/g, '\x1b8$1\x1bc$2\x1b9$2');

        input = input.replace(/\x1b0([^])/g, (_match, p1) => `PRINT THE CHARACTER WITH THE ASCII VALUE ${p1.charCodeAt(0)}`)
        input = input.replace(/\x1b1/g, 'DECLARE THE NEW VARIABLE ')
        input = input.replace(/\x1b2/g, 'OPEN THE VARIABLE ')
        input = input.replace(/\x1b3/g, 'ASSIGN ')
        input = input.replace(/\x1b4/g, ' TO THE OPEN VARIABLE')
        input = input.replace(/\x1b5/g, 'MULTIPLY THE OPEN VARIABLE BY')
        input = input.replace(/\x1b6/g, 'PRINT THE OPEN VARIABLE\'S CHARACTER')
        input = input.replace(/\x1b7/g, 'PRINT THE OPEN VARIABLE\'S VALUE')
        input = input.replace(/\x1b8/g, 'JUMP TO ')
        input = input.replace(/\x1b9/g, ' IS EQUAL TO ')
        input = input.replace(/\x1ba/g, ' IS GREATER THAN ')
        input = input.replace(/\x1bb/g, ' IS LESS THAN ')
        input = input.replace(/\x1bc/g, ' IF ')
        input = input.replace(/\x1bd/g, 'DEFINE THE NEW LABEL ')
        input = input.replace(/\x1be/g, 'END THIS PROGRAM')
        input = input.replace(/\x1bf/g, 'GET INPUT AND STORE INTO OPEN VARIABLE AS A CHARACTER')
        input = input.replace(/\x1bg/g, 'GET INPUT AND STORE INTO OPEN VARIABLE AS A NUMBER')
        input = input.replace(/\x1bh/g, 'ADD ')
		if(ver!=='1') input = input.replace(/\x1bi/g, 'PRINT THE STRING ``')
		if(ver!=='1') input = input.replace(/\x1bj/g, 'CREATE THE VARIABLE ')
		if(ver!=='1') input = input.replace(/\x1bk/g, 'USE: ')
		if(ver!=='1') input = input.replace(/\x1c4(-?\d+)\x1d(-?\d+)/g, 'PUT A RANDOM NUMBER BETWEEN $1 AND $2 INTO THE OPEN VARIABLE')
        input = input.replace(/\n/g, '\r\n')
    } else {
        console.error("\x1b[31mUnsupported compression method/version\x1b[0m");
        return null;
    }
    return input;
}

const input = process.argv[2]??"./code.uyj"

let compress = 1;
if(process.argv.includes("--no-decompression")||process.argv.includes("-nd")) compress = 0;
if(process.argv.includes("--force-decompression")||process.argv.includes("-fd")) compress = 2;

const direct_code = process.argv.indexOf("--direct");

let code1, code0;
if(direct_code==-1) {
	try {
		code0 = code1 = fs.readFileSync(input, { encoding: "utf-8" });
	} catch (e) {
		if (e.code = "ENOENT") {
			console.error("Can't find the input file \x1b[46;30m%s\x1b[0m. try \x1b[46;30mnode interpreter.mjs ./examples/battle_game/game.uyj\x1b[0m!",input);
			process.exit(1);
		}
	}
} else {
	code1 = code0 = process.argv[direct_code+1]??"ERROR_NOT_FOUND";
	compress = 2;
}



if(((/^UYJ\d_/.test(code1)||direct_code!==-1)&&compress==1)||compress==2){
	console.log("Now decompressing...")
	code1=decompress(code1);
	if(code1==null) {
		console.error("\x1b[41;30mDECOMPRESSION FALIURE.\x1b[0m")
		if(compress==2) {
			console.error("\x1b[41;30mABORTING\x1b[0m")
			process.exit(1);
		} else {
			console.error("\x1b[41;30mCANCELLED\x1b[0m")
			code1=code0;
		}
	} else {
		fs.writeFileSync('./decompressed_code.uyj',code1)
	}
}

const code2 = code1.split(/(?:\r?\n){1,}/).map(a => a.trim()).filter(a => a !== '');
const $1 = console.log;
const $ = _ => process.stdout.write(_);
let PC = 0, labels = {}, vars = {}, openVar = '';
const builtinLibs=["STRINGPRINT","QUICKVAR","RANDOM"];
const usedLibs=[];

//process.stdin.setRawMode(true);

code2.forEach((e, i, a) => {
	if (/^DEFINE THE NEW LABEL|^DTNL/i.test(e)) {
		const label = e.match(/[\w_!@#$%^&*()+=]+$/)[0];
		labels[label] = i;
	}
})

function $$(PC, ...details) {
	details[0] = "\n" + details[0];
	$1(...details);
	$1("On line %d: I'd cut your time in half, but there's no timers here.", PC + 1)
	process.exit(1);
}

while (PC < code2.length) {
	const line = code2[PC];
	//$1(`\x1b[92m${PC}: \x1b[1;36m${line}\x1b[0;92m`.padEnd(70) + `:${PC}\x1b[0m`)
	if(/^USE: .+$/.test(line)) {
		const library = line.match(/(?<=^USE: ).+$/)[0];
		if(builtinLibs.includes(library)){
			usedLibs.push(library);
		} else $$(PC,"Invalid USE: %s",library)
		PC++;
	} else if (/^(?:PRINT THE CHARACTER WITH THE (?:ASCII|UNICODE) VALUE |PTCWT[AU]V)\d+$/.test(line)) {
		const value = +line.match(/\d+$/)[0];
		const char = String.fromCharCode(value);
		$(char);
		PC++;
	} else if (/^(?:DECLARE THE NEW VARIABLE|DTNV) [\w_!@#$%^&*()+=]+$/.test(line)) {
		const name = line.match(/[\w_!@#$%^&*()+=]+$/)[0];
		vars[name] = 0;
		PC++;
	} else if (/^(?:OPEN THE VARIABLE|OTV) [\w_!@#$%^&*()+=]+$/.test(line)) {
		const name = line.match(/[\w_!@#$%^&*()+=]+$/)[0];
		openVar = name;
		if (vars[openVar] == undefined) $$(PC, "You can't open an undeclared variable (like %s)", name);
		PC++
	} else if (/^(?:ASSIGN |A)-?\d+(?: TO THE OPEN VARIABLE| ?TTOV)$/.test(line)) {
		const val = +line.match(/-?\d+/)[0];
		vars[openVar] = val;
		PC++
	} else if (/^ADD [\w_!@#$%^&*()+=]+ (?:TO THE OPEN VARIABLE|TTOV)$/.test(line)) {
		const val = vars[line.match(/(?<=^ADD\s|^A\s)[\w_!@#$%^&*()+=]+/)[0]];
		if (val == undefined) $$(PC, "You can't add using an undeclared variable");
		vars[openVar] += val;
		PC++;
	} else if (/^(?:MULTIPLY THE OPEN VARIABLE BY|MTOVB) [\w_!@#$%^&*()+=]+$/.test(line)) {
		const val = vars[line.match(/[\w_!@#$%^&*()+=]+$/)[0]];
		if (val == undefined) $$(PC, "You can't multiply using an undeclared variable");
		vars[openVar] *= val;
		PC++;
	} else if (/^PRINT THE OPEN VARIABLE'S CHARACTER$|^PTOVC$/.test(line)) {
		const value = vars[openVar];
		const char = String.fromCharCode(value);
		$(char);
		PC++;
	} else if (/^PRINT THE OPEN VARIABLE'S VALUE$|^PTOVV$/.test(line)) {
		const value = vars[openVar];
		$(String(value));
		PC++;
	} else if (/^(?:DEFINE THE NEW LABEL|DTNL) [\w_!@#$%^&*()+=]+$/.test(line)) {
		PC++;
	} else if (/^(?:JUMP TO|JT) [\w_!@#$%^&*()+=]+ IF [\w_!@#$%^&*()+=]+ (?:IS EQUAL TO|IET) [\w_!@#$%^&*()+=]+$/.test(line)) {
		const name1 = line.match(/[\w_!@#$%^&*()+=]+(?= IF)/)[0];
		const name2 = line.match(/(?<=IF )[\w_!@#$%^&*()+=]+/)[0];
		const name3 = line.match(/[\w_!@#$%^&*()+=]+$/)[0];
		if (labels[name1] == undefined || vars[name2] == undefined || vars[name3] == undefined)
			$$(PC, "SPEEEEEEEEN (%s %s %s)",name1,name2,name3)

		if (vars[name2] == vars[name3])
			PC = labels[name1];
		else PC++;
	} else if (/^(?:JUMP TO|JT) [\w_!@#$%^&*()+=]+ IF [\w_!@#$%^&*()+=]+ (?:IS GREATER THAN|IGT) [\w_!@#$%^&*()+=]+$/.test(line)) {
		const name1 = line.match(/[\w_!@#$%^&*()+=]+(?= IF)/)[0];
		const name2 = line.match(/(?<=IF )[\w_!@#$%^&*()+=]+/)[0];
		const name3 = line.match(/[\w_!@#$%^&*()+=]+$/)[0];
		if (labels[name1] == undefined || vars[name2] == undefined || vars[name3] == undefined)
		$$(PC, "SPEEEEEEEEN (%s %s %s)",name1,name2,name3)

		if (vars[name2] > vars[name3])
			PC = labels[name1];
		else PC++;
	} else if (/^(?:JUMP TO|JT) [\w_!@#$%^&*()+=]+ IF [\w_!@#$%^&*()+=]+ (?:IS LESS THAN|ILT) [\w_!@#$%^&*()+=]+$/.test(line)) {
		const name1 = line.match(/[\w_!@#$%^&*()+=]+(?= IF)/)[0];
		const name2 = line.match(/(?<=IF )[\w_!@#$%^&*()+=]+/)[0];
		const name3 = line.match(/[\w_!@#$%^&*()+=]+$/)[0];
		if (labels[name1] == undefined || vars[name2] == undefined || vars[name3] == undefined)
		$$(PC, "SPEEEEEEEEN (%s %s %s)",name1,name2,name3)

		if (vars[name2] < vars[name3])
			PC = labels[name1];
		else PC++;
	} else if (/^GET INPUT AND STORE INTO OPEN VARIABLE AS A CHARACTER$|^GIASIOVAAC$/.test(line)) {
		const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
		await new Promise(resolve => {
			rl.question("character pls:", a => {
				vars[openVar] = a.charCodeAt(0);
				rl.close();
				resolve();
			})
		})
		PC++;
	} else if (/^GET INPUT AND STORE INTO OPEN VARIABLE AS A NUMBER$|^GIASIOVAAN$/.test(line)) {
		const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
		await new Promise(resolve => {
			rl.question("number pls:", a => {
				vars[openVar] = +a;
				rl.close();
				resolve();
			})
		})
		PC++;
	} else if (/^END THIS PROGRAM|ETP$/.test(line)) {
		process.exit(0);
	} else if (/^NOTE THAT |^\/\//.test(line)) {
		PC++;
	} else if(/^PRINT THE STRING ``.+``$/.test(line)) {
		if(usedLibs.includes("STRINGPRINT")) {
			$(line.match(/(?<=``).+(?=``)/)[0].replace(/\\r\\n|\\r|\\n/g,'\r\n').replace(/\\e/g,'\x1b'));
			PC++;
		} else {
			$$(PC,"%s!? never heard of it...\n(try adding \"USE: STRINGPRINT\" at the start of your code to add the extension. Drexel will hate you, though.)",line);
		}
	} else if(/^CREATE THE VARIABLE [\w_!@#$%^&*()+=]+\s+AS -?\d+$/.test(line)) {
		if(usedLibs.includes("QUICKVAR")) {
			const variable = line.match(/(?<=VARIABLE )[\w_!@#$%^&*()+=]+/)[0];
			const value = line.match(/-?\d+$/)[0];
			vars[variable] = +value;
			PC++;
		} else {
			$$(PC,"%s!? never heard of it...\n(try adding \"USE: QUICKVAR\" at the start of your code to add the extension. Drexel will hate you, though.)",line);
		}
	} else if(/^PUT A RANDOM NUMBER BETWEEN -?\d+ AND -?\d+ INTO THE OPEN VARIABLE$/.test(line)) {
		if(usedLibs.includes("RANDOM")) {
			const value1 = +line.match(/(?<=N )-?\d+/)[0];
			const value2 = +line.match(/(?<=D )-?\d+/)[0];
			vars[openVar] = Math.floor((Math.random()*(value2-value1+1))+value1);
			PC++;
		} else {
			$$(PC,"%s!? never heard of it...\n(try adding \"USE: RANDOM\" at the start of your code to add the extension. Drexel will hate you, though.)",line);
		}
	}

	else {
		$$(PC, "What does \"%s\" mean!?", line);
	}
}

$$(code2.length, "You didn't type end this program...? GRRRR");
