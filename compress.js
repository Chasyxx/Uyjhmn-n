function btoa(a){
    return Buffer.from(a,'utf8').toString('base64');
}
function atob(a){
    return Buffer.from(a,'base64').toString('utf8');
}

const fs = require('fs');

const input = process.argv[2]??"./code.txt"
const output = process.argv[3]??"./code_compressed.txt"

console.log("%s >|> %s",input,output)

let code = fs.readFileSync(input, {encoding:"utf-8"});

code = code.replace(/\r\n/g,'\n')

code = code.replace(/(?:PRINT THE CHARACTER WITH THE (ASCII|UNICODE) VALUE |PTCWT[AU]V)(\d+)/g,(_match,p1,p2)=>`\x1b0${String.fromCharCode(+p2)}`);
code = code.replace(/DECLARE THE NEW VARIABLE |DTNV /g,'\x1b1');
code = code.replace(/OPEN THE VARIABLE |OTV /g,'\x1b2');
code = code.replace(/ASSIGN |A(?=\d\s?T)/g,'\x1b3');
code = code.replace(/ TO THE OPEN VARIABLE|\s?TTOV/g,'\x1b4');
code = code.replace(/MULTIPLY THE OPEN VARIABLE BY|MTOVB/g,'\x1b5');
code = code.replace(/PRINT THE OPEN VARIABLE'S CHARACTER|PTOVC/g,'\x1b6');
code = code.replace(/PRINT THE OPEN VARIABLE'S VALUE|PTOVV/g,'\x1b7');
code = code.replace(/JUMP TO |JT /g,'\x1b8');
code = code.replace(/ IS EQUAL TO | IET /g,'\x1b9');
code = code.replace(/ IS GREATER THAN | IGT /g,'\x1ba');
code = code.replace(/ IS LESS THAN | ILT /g,'\x1bb');
code = code.replace(/ IF /g,'\x1bc');
code = code.replace(/DEFINE THE NEW LABEL |DTNL /g,'\x1bd');
code = code.replace(/END THIS PROGRAM|ETP/g,'\x1be');
code = code.replace(/GET INPUT AND STORE INTO OPEN VARIABLE AS A CHARACTER|GIASIOVAAC/g,'\x1bf');
code = code.replace(/GET INPUT AND STORE INTO OPEN VARIABLE AS A NUMBER|GIASIOVAAN/g,'\x1bg');
code = code.replace(/ADD /g,'\x1bh');
code = code.replace(/PRINT THE STRING ``/g,'\x1bi');
code = code.replace(/CREATE THE VARIABLE /g,'\x1bj');
code = code.replace(/USE: /g,'\x1bk');

code = code.replace(/\x1b3(-?\d+)\x1b4/g,'\x1c0$1');
code = code.replace(/\x1b1([\w_!@#$%^&*()+=]+)\n\x1b2\1/g,'\x1c1$1');
code = code.replace(/\x1b8([\w_!@#$%^&*()+=]+)\x1bc([\w_!@#$%^&*()+=]+)\x1b9\2/g,'\x1c2$1\x1d$2')

code = code.replace(/\x1c1([\w_!@#$%^&*()+=]+)\n\x1c0(-?\d+)/g,'\x1c3$1\x1d$2')

code = ("UYJ2_"+btoa(code));
//code = code.replace(/([^\r\n]{40})/g,'$1\n');

console.log("\n\n%s\n\nSucessfully made %d bytes of data",code,code.length);

fs.writeFileSync(output,code);