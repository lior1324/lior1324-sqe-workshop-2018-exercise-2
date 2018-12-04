import $ from 'jquery';
import {parseCode} from './code-analyzer';

let localDic={}
let globalDic={}
let codeTo='';
let userVars=';'

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

function functionDeclarationFinder (parsedCode){
    // moving the parameter that we get by the thing.
    var partOfInput = smartSplit(userVars);
    for(var i in parsedCode['params']) {
        matchInput2Dic(partOfInput[i].trim(),parsedCode['params'][i]);
    }
    // moving down the slide and search wat is happening.
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
    }else if(isNaN(value)){// true / false
        checkIfTrueOrFalse(value,parsedCode);
    }else{// number
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
        }else if(isNaN(value)){// true / false
            checkIfTrueOrFalseArr(i,value,parsedCode);
        }else{// number
            turnToNumberArr(i,value,parsedCode);
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

}
function unaryExpressionGlobal(parsedCode){

}
function memberExpressionGlobal(parsedCode){
    // return globalDic[parsedCode['name']];
}
function identifierFunctionGlobal(parsedCode){
    return globalDic[parsedCode['name']];
}
