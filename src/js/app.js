import $ from 'jquery';
import {parseCode} from './code-analyzer';

let localDic={};
let globalDic={};
let userVars='';
let codeLines='';
let insideTrueIf=true;
let stopColor=false;
let outputLines=[];
let functionRow=0;

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let vars= $('#parameterInput').val();
        let parsedCode = parseCode(codeToParse);
        var table = document.getElementById('grandTable');
        var row = table.rows[1];
        var cell = row.cells[1];
        cell.innerHTML=getTextFinished(parsedCode,codeToParse,vars);
    });
});

function getTextFinished(parsedCode,codeToParse,variables){
    globalDic={};localDic={};functionRow=0;outputLines=[];stopColor=false;insideTrueIf=true;
    userVars=variables;
    codeLines=codeToParse.split('\n');
    for(var i in parsedCode) { // im walking above all the out side.
        if (i === 'body') {
            for (var j in parsedCode[i]) {// thats the array of all the functions.
                if (parsedCode[i][j]['type'] === 'FunctionDeclaration') {
                    functionDeclarationFinder(parsedCode[i][j]);
                } else {
                    globalTreat(parsedCode[i][j]);
                    functionRow++;
                }
            }
        }
    }
    return textToDisplay();
}
function textToDisplay(){
    var hugeString='';
    var tableLength = outputLines.length;
    for (var i = 0; i < tableLength; i++) {
        if(outputLines[i].includes('~')){// green
            hugeString = hugeString +'<p style=\'background-color:#4ff955\'>'+ outputLines[i].substring(0, outputLines[i].length-1) + '</p> \n';
        }else if(outputLines[i].includes('@')){// red
            hugeString = hugeString +'<p style=\'background-color:#fc3320\'>'+ outputLines[i].substring(0, outputLines[i].length-1) + '</p> \n';
        }else {
            hugeString = hugeString +'<p>'+ outputLines[i] + '</p> \n';
        }
    }
    return hugeString;
}
function  functionDeclarationFinder (parsedCode){
    // moving the parameter that we get by the thing.
    outputLines.push (codeLines[functionRow]);
    functionRow++;
    var partOfInput = smartSplit(userVars);
    for(var i in parsedCode['params']) {
        matchInput2Dic(partOfInput[i].trim(),parsedCode['params'][i]);
    }
    for (var j in parsedCode['body']['body']){
        localTreat(parsedCode['body']['body'][j]);
    }
    outputLines.push ('}');
    functionRow++;
    // moving down the slide just copy the sentences down and u all good.
}
function localTreat(parsedCode){
    if(parsedCode['type']==='VariableDeclaration') {
        declarationLocal(parsedCode['declarations']);
    }else if (parsedCode['type']==='ExpressionStatement') {
        assigmentLocal(parsedCode['expression']);
    }else if(parsedCode['type']==='IfStatement'){
        IfLocal(parsedCode,'if ',true);
    }else if(parsedCode['type']==='ReturnStatement'){
        returnLocal(parsedCode);
    }else{ // while
        whileLocal(parsedCode);
    }
}
function declarationLocal(parsedCode){
    // remove from the line
    functionRow++;
    for (var i in parsedCode) {
        if(parsedCode[i]['init']!=null) {
            if (parsedCode[i]['init']['type'] === 'ArrayExpression') {
                for (var j in parsedCode[i]['init']['elements']) {
                    var name = parsedCode[i]['id']['name'] + '[' + j + ']';
                    localDic[name] = getString(parsedCode[i]['init']['elements'][j]);
                }
            } else {
                localDic[parsedCode[i]['id']['name']] = getString(parsedCode[i]['init']);
            }
        }
        else {
            localDic[parsedCode[i]['id']['name']] = '';
        }
    }
}
function getString (parsedCode){
    if(parsedCode['type']==='Literal'){
        return literalFunctionLocal(parsedCode);
    }
    if(parsedCode['type']==='Identifier'){
        return identifierFunctionLocal(parsedCode);
    }
    if(parsedCode['type']==='MemberExpression'){
        return memberExpressionLocal(parsedCode);
    }
    if(parsedCode['type']==='UnaryExpression'){
        return unaryExpressionLocal(parsedCode);
    }else{
        return binaryExpressionLocal(parsedCode);
    }
}
function literalFunctionLocal(parsedCode){
    return parsedCode['raw'];
}

function identifierFunctionLocal(parsedCode){
    if(globalDic.hasOwnProperty(parsedCode['name'])){
        return parsedCode['name'];
    }else{
        return localDic[parsedCode['name']];
    }
}
function memberExpressionLocal(parsedCode){
    var string = parsedCode['object']['name'] + '[' + getInit(parsedCode['property']) + ']';
    if(globalDic.hasOwnProperty(string)){
        return string;
    }else{
        return localDic[string];
    }
}
function unaryExpressionLocal(parsedCode){
    return parsedCode['operator']+' ('+getString(parsedCode['argument'])+')';
}
function binaryExpressionLocal(parsedCode){
    var left=0,right=0;
    if(parsedCode['left']['type']==='Literal'){
        left=literalFunctionLocal(parsedCode['left']);
    }else if (parsedCode['left']['type']==='Identifier'){
        left = identifierFunctionLocal(parsedCode['left']);
    }else {
        left= binaryExpressionLocal2(parsedCode['left']);
    }
    if(parsedCode['right']['type']==='Literal'){
        right=literalFunctionLocal(parsedCode['right']);
    }else if (parsedCode['right']['type']==='Identifier'){
        right = identifierFunctionLocal(parsedCode['right']);
    }
    else {
        right = binaryExpressionLocal2(parsedCode['right']);
    }
    return '('+left+' '+parsedCode['operator']+' '+right+')';
}
function binaryExpressionLocal2 (parsedCode){
    if(parsedCode['type']==='MemberExpression'){
        return memberExpressionLocal(parsedCode);
    }else if(parsedCode['type']==='UnaryExpression'){
        return unaryExpressionLocal(parsedCode);
    }else { // binary expression
        return '('+getString(parsedCode['left'])+' '+parsedCode['operator']+' '+getString(parsedCode['right'])+')';
    }
}
function assigmentLocal(parsedCode){
    // check left and right and add to the table accordingly
    functionRow++;
    var left = findWhatLeftGlobal(parsedCode['left']);
    var rights = getString(parsedCode['right']);
    var rightv = getInit(parsedCode['right']);
    if(globalDic.hasOwnProperty(left)){
        globalDic[left]=rightv;
        outputLines.push(left+' = '+rights+';');
    }else{
        localDic[left]=rights;
    }
}
function IfLocal (parsedCode,ifelse,shouldIColor)
{
    var saveLocal={},saveGlobal={};
    saveLocal=copyDic(localDic);saveGlobal=copyDic(globalDic);
    var IfTest=getString(parsedCode['test']),color='';
    color =booleanToColor(myEval(parseCode(IfTest)['body'][0]['expression']));        functionRow++;    color=checkIfColor(shouldIColor,color);
    if(parsedCode['consequent']['type']==='BlockStatement'){
        outputLines.push(ifelse+' ('+IfTest+') {' + color);
        for (var j in parsedCode['consequent']['body']){
            localTreat(parsedCode['consequent']['body'][j]);}
        outputLines.push('}');functionRow++;}
    else{
        outputLines.push(ifelse+' ('+IfTest+')'+color);
        localTreat(parsedCode['consequent']);}
    localDic=saveLocal;globalDic=saveGlobal;
    if(parsedCode['alternate']!=null){
        elseIfStatementFinder(parsedCode['alternate'],color);
    }
    localDic=saveLocal;globalDic=saveGlobal;
}
function checkIfColor(shouldIColor,color){
    if(stopColor===true)
    {
        return '';
    }
    if(shouldIColor===false){
        return '';
    }
    if(color==='~'){
        insideTrueIf=true;
    }
    else{
        insideTrueIf=false;
    }
    return color;
}
function copyDic(Dic){
    var ans ={};
    for (var key in Dic) {
        ans[key]=Dic[key];
    }
    return ans;
}
function booleanToColor(bool){
    if(bool)
        return '~'; // green is mapped to ~
    return '@'; // red is mapped to @
}
function myEval(parsedCode){
    if(parsedCode['type']==='UnaryExpression'){
        return !(myEval(parsedCode['argument']));
    }else{
        var left =getInit(parsedCode['left']);
        var right=getInit(parsedCode['right']);
        var ans = eval(left +parsedCode['operator']+right);
        return ans;
    }
}
function elseIfStatementFinder (parsedCode,color)
{
    if(parsedCode['type']==='IfStatement'){ // case of else if
        if(color==='~'){
            IfLocal(parsedCode,'else if ',false); // e for else if
        }else{
            IfLocal(parsedCode,'else if ',true);} // e for else if
    }
    else{ // case of else
        functionRow++;
        if(parsedCode['type']==='BlockStatement'){// check if block or not {}....
            outputLines.push('else {');
            for (var j in parsedCode['body']){
                localTreat(parsedCode['body'][j]);}
            outputLines.push('}');        functionRow++;
        } else{
            outputLines.push('else');
            localTreat(parsedCode);}
    }
}
function returnLocal(parsedCode){
    var string =getString(parsedCode['argument']);
    var newLine='return '+string+';';
    functionRow++;
    if(insideTrueIf){
        stopColor=true;
    }
    outputLines.push(newLine);
}
function whileLocal(parsedCode){
    var whileTest;
    whileTest=getString(parsedCode['test']);
    functionRow++;
    if(parsedCode['body']['type']==='BlockStatement'){
        outputLines.push('while ('+whileTest+') {');
        for (var j in parsedCode['body']['body']){
            localTreat(parsedCode['body']['body'][j]);
        }
        outputLines.push('}');
        functionRow++;
    }
    else{
        outputLines.push('while ('+whileTest+')');
        localTreat(parsedCode['body']);
    }
}
function smartSplit(input){
    var array='',flag=false,ans=[],splitted = input.split(',');
    for(var i in splitted){
        if(splitted[i].includes('[')){
            array = array+splitted[i]+', ';
            flag=true;
        }
        else if(splitted[i].includes(']')){
            ans.push(array+splitted[i]);
            flag=false;array='';
        } else if(flag===true) {
            array=array+splitted[i]+', ';
        }else {
            ans.push(splitted[i]);
        }
    }
    return ans;
}
function matchInput2Dic(value,parsedCode){
    if (value.includes('[')){ //array
        arrayHandler(value.substring(1, value.length-1),parsedCode);
    }else if(value.includes('\'') || value.includes('"')){ // string
        value = value.substring(1, value.length-1);
        globalDic[parsedCode['name']]=value;
    }else if(isNaN(value)){// number
        checkIfTrueOrFalse(value,parsedCode);
    }else{// true / false
        turnToNumber(value,parsedCode);
    }
}
function turnToNumber(value,parsedCode){
    if(value.includes('.')){
        globalDic[parsedCode['name']]=parseFloat(value);
    }else{
        globalDic[parsedCode['name']]=parseInt(value);
    }
}

function arrayHandler (value,parsedCode){
    var partOfInput = value.split(',');
    for (var i in partOfInput){
        partOfInput[i]=partOfInput[i].trim();
        if(partOfInput[i].includes('\'') || partOfInput[i].includes('"')){ // string
            value = partOfInput[i].substring(1, partOfInput[i].length-1);
            globalDic[parsedCode['name']+'['+i+']']=value;
        }else if(isNaN(partOfInput[i])){// true / false
            checkIfTrueOrFalseArr(i,partOfInput[i],parsedCode);
        }else{// number
            turnToNumberArr(i,partOfInput[i],parsedCode);
        }
    }
}
function turnToNumberArr (i,value,parsedCode){
    if(value.includes('.')){
        globalDic[parsedCode['name']+'['+i+']']=parseFloat(value);
    }else{
        globalDic[parsedCode['name']+'['+i+']']=parseInt(value);
    }
}
function checkIfTrueOrFalseArr (i,value,parsedCode){
    if(value==='true'){
        globalDic[parsedCode['name']+'['+i+']']=true;
    }
    else{
        globalDic[parsedCode['name']+'['+i+']']=false;
    }
}
function checkIfTrueOrFalse(value,parsedCode){
    if(value==='true'){
        globalDic[parsedCode['name']]=true;
    }
    else{
        globalDic[parsedCode['name']]=false;
    }
}
function globalTreat(parsedCode){
    if(parsedCode['type']==='VariableDeclaration')
    {
        declarationGlobal(parsedCode['declarations']);
    }
    else
    {
        assigmentGlobal(parsedCode);
    }

}

function assigmentGlobal(parsedCode){
    // need to check if it cointains in the global array
    // otherwise we change the value of it
    var left = findWhatLeftGlobal(parsedCode['expression']['left']);
    var right = getInit(parsedCode['expression']['right']);
    globalDic[left]=right;
    outputLines.push(left+' = '+right+';');
}


function findWhatLeftGlobal (parsedCode){
    if(parsedCode['type']==='MemberExpression'){
        return parsedCode['object']['name'] + '[' + getInit(parsedCode['property']) + ']';
    }else{
        return parsedCode['name'];
    }
}

function declarationGlobal(parsedCode){
    for (var i in parsedCode) {
        if(parsedCode[i]['init']!=null) {
            if (parsedCode[i]['init']['type'] === 'ArrayExpression') {
                for (var j in parsedCode[i]['init']['elements']) {
                    var name = parsedCode[i]['id']['name'] + '[' + j + ']';
                    globalDic[name] = getInit(parsedCode[i]['init']['elements'][j]);
                }
            } else {
                globalDic[parsedCode[i]['id']['name']] = getInit(parsedCode[i]['init']);
            }
        }
        else {
            globalDic[parsedCode[i]['id']['name']] = 0;
        }
    }
    outputLines.push(codeLines[functionRow]);
}

function getInit(parsedCode){
    // literal computed identifier unary binary
    if(parsedCode['type']==='Literal'){
        return literalFunctionGlobal(parsedCode);
    }
    if(parsedCode['type']==='Identifier'){
        return identifierFunctionGlobal(parsedCode);
    }
    if(parsedCode['type']==='MemberExpression'){
        return memberExpressionGlobal(parsedCode);
    }
    if(parsedCode['type']==='UnaryExpression'){
        return unaryExpressionGlobal(parsedCode);
    }else{
        return binaryExpressionGlobal(parsedCode);
    }
}

function literalFunctionGlobal(parsedCode){
    return parsedCode['value'];
}
function binaryExpressionGlobal(parsedCode){
    var left=0,right=0;
    if(parsedCode['left']['type']==='Literal'){
        left=parsedCode['left']['value'];
    }else if (parsedCode['left']['type']==='Identifier'){
        left = globalDic[parsedCode['left']['name']];
    }else {
        left= binaryExpressionGlobal2(parsedCode['left']);
    }
    if(parsedCode['right']['type']==='Literal'){
        right=parsedCode['right']['value'];
    }else if (parsedCode['right']['type']==='Identifier'){
        right = globalDic[parsedCode['right']['name']];
    }
    else {
        right = binaryExpressionGlobal2(parsedCode['right']);
    }
    return getValueGlobal(left,right,parsedCode['operator']);

}

function binaryExpressionGlobal2(parsedCode){
    if(parsedCode['type']==='MemberExpression'){
        var string = parsedCode['object']['name'] + '[' + getInit(parsedCode['property']) + ']';
        return globalDic[string];
    }else if(parsedCode['type']==='UnaryExpression'){
        return -1 * getInit(parsedCode['argument']);
    }else { // binary expression
        return getValueGlobal(getInit(parsedCode['left']),getInit(parsedCode['right']),parsedCode['operator']);
    }
}

function getValueGlobal(left,right,operator){
    switch (operator){
    case '+':
        return left+right;
    case '-':
        return left-right;
    case '*':
        return left*right;
    case '/':
        return left/right;
    }
}
function unaryExpressionGlobal(parsedCode){
    return -1 * getInit(parsedCode['argument']);
}
function memberExpressionGlobal(parsedCode){
    var string = parsedCode['object']['name'] + '[' + getInit(parsedCode['property']) + ']';
    return globalDic[string];
}
function identifierFunctionGlobal(parsedCode){
    return globalDic[parsedCode['name']];
}
