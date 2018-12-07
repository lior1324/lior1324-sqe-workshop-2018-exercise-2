import $ from 'jquery';
import {parseCode} from './code-analyzer';

let localDic={}
let globalDic={}
let codeTo='';
let userVars='';
let codeLines="";
let outputLines="";

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let vars= $('#parameterInput').val();
        let parsedCode = parseCode(codeToParse);
        getTextFinished(parsedCode,codeToParse,vars);
        $('#parsedCode').val(JSON.stringify(parsedCode, null, 2));
    });
});

function getTextFinished(parsedCode,codeToParse,variables){
    globalDic={};localDic={};
    userVars=variables
    codeTo=codeToParse;
    codeLines=codeToParse.split('\n');
    for(var i in parsedCode){ // im walking above all the out side.
        if(i==='body'){
            for (var j in parsedCode[i]){// thats the array of all the functions.
                if (parsedCode[i][j]['type'] === 'FunctionDeclaration') {
                    functionDeclarationFinder(parsedCode[i][j]);
                } else {
                    globalTreat(parsedCode[i][j]);
                }
            }
        }
    }
}

function  functionDeclarationFinder (parsedCode){
    // moving the parameter that we get by the thing.
    var partOfInput = smartSplit(userVars);
    for(var i in parsedCode['params']) {
        matchInput2Dic(partOfInput[i].trim(),parsedCode['params'][i]);
    }
    for (var i in parsedCode['body']['body']){
        localTreat(parsedCode['body']['body'][i]);
    }
    // moving down the slide just copy the sentences down and u all good.
}
function localTreat(parsedCode){
    if(parsedCode['type']==='VariableDeclaration') {
        declarationLocal(parsedCode['declarations']);
    }else if (parsedCode['type']==='ExpressionStatement') {
        assigmentLocal(parsedCode['expression']);
    }else if(parsedCode['type']==='IfStatement'){
        IfLocal(parsedCode,'If statement');
    }else if(parsedCode['type']==='ReturnStatement'){
        returnLocal(parsedCode);
    }else{ // while
        whileLocal(parsedCode);
    }
}
function declarationLocal(parsedCode){
    // remove from the line
    // insert into table.
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
    return '- '+'('+getString(parsedCode['argument'])+')';
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
    var left = findWhatLeftGlobal(parsedCode['left']);
    var rights = getString(parsedCode['right']);
    var rightv = getInit(parsedCode['right']);
    if(globalDic.hasOwnProperty(left)){
        globalDic[left]=rightv;
    }else{
        localDic[left]=rights;
    }
}
function IfLocal (parsedCode)
{
    var IfTest=getString(parsedCode['test']);
    if(parsedCode['consequent']['type']==='BlockStatement'){
        for (var j in parsedCode['consequent']['body']){
            localTreat(['consequent']['body'][j]);
        }
    }
    else{
        localTreat(parsedCode['consequent']);
    }
    if(parsedCode['alternate']!=null){
        elseIfStatementFinder(parsedCode['alternate']);
    }
}

function elseIfStatementFinder (parsedCode)
{
    var IfTest=getString(parsedCode['test']);
    if(parsedCode['type']==='IfStatement'){ // case of else if
        IfLocal(parsedCode,'Else If Statement');} // e for else if
    else{ // case of else
        if(parsedCode['type']==='BlockStatement'){// check if block or not {}....
            //alert('normal else row '+elseRow);
            for (var j in parsedCode['body']){
                localTreat(parsedCode['body'][j]);}
        }
        else{
            //alert('normal else row '+elseRow);
            localTreat(parsedCode);}
    }
}
function returnLocal(parsedCode){
    var string =getString(parsedCode['argument']);
    var newLine='return '+string;
}
function symbolChange(parsedCode){
    if(parsedCode['type']==='Literal'){
        return literalFunctionSymbol(parsedCode);
    }
    if(parsedCode['type']==='Identifier'){
        return identifierFunctionSymbol(parsedCode);
    }
    if(parsedCode['type']==='MemberExpression'){
        return memberExpressionSymbol(parsedCode);
    }
    if(parsedCode['type']==='UnaryExpression'){
        return unaryExpressionSymbol(parsedCode);
    }else{
        return binaryExpressionSymbol(parsedCode);
    }
}
function literalFunctionSymbol(parsedCode){
    return parsedCode['raw'];
}
function identifierFunctionSymbol(parsedCode){
    var name = parsedCode['name'];
    if(globalDic.hasOwnProperty(name)){
        return name;
    }else{
        return localDic[name];
    }
}
function memberExpressionSymbol(parsedCode){
    var name = getString(parsedCode);
    if(globalDic.hasOwnProperty(name)){
        return name;
    }else{
        return localDic[name];
    }
}
function unaryExpressionSymbol(parsedCode){
    return '- '+ symbolChange(parsedCode['argument']);
}
function binaryExpressionSymbol(parsedCode){
    var left=0,right=0;
    if(parsedCode['left']['type']==='Literal'){
        left=literalFunctionSymbol(parsedCode['left']);
    }else if (parsedCode['left']['type']==='Identifier'){
        left = identifierFunctionSymbol(parsedCode['left']);
    }else {
        left= binaryExpressionSymbol2(parsedCode['left']);
    }
    if(parsedCode['right']['type']==='Literal'){
        right=literalFunctionSymbol(parsedCode['right']);
    }else if (parsedCode['right']['type']==='Identifier'){
        right = identifierFunctionSymbol(parsedCode['right']);
    }
    else {
        right = binaryExpressionSymbol2(parsedCode['right']);
    }
    return '('+left+' '+parsedCode['operator']+' '+right+')';
}
function binaryExpressionSymbol2 (parsedCode){
    if(parsedCode['type']==='MemberExpression'){
        return memberExpressionSymbol(parsedCode);
    }else if(parsedCode['type']==='UnaryExpression'){
        return unaryExpressionSymbol(parsedCode);
    }else { // binary expression
        return symbolChange(parsedCode['left'])+parsedCode['operator']+symbolChange(parsedCode['right']);
    }
}


function whileLocal(parsedCode){
    var whileTest;
    whileTest=getString(parsedCode['test']);
    //alert(whileLocation + whileTest)
    if(parsedCode['body']['type']==='BlockStatement'){
        for (var j in parsedCode['body']['body']){
            localTreat(parsedCode['body']['body'][j]);
        }
    }
    else{
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
