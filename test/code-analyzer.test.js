import assert from 'assert';
import {getTextFinished} from '../src/js/code-analyzer';

describe('The javascript parser', () => {

    it('is parsing test #1 aviram', () => { //1
        assert.equal(
            getTextFinished('function foo(x, y, z){\n' +
                '    let a = x + 1;\n' +
                '    let b = a + y;\n' +
                '    let c = 0;\n' +
                '    \n' +
                '    if (b < z) {\n' +
                '        c = c + 5;\n' +
                '        return x + y + z + c;\n' +
                '    } else if (b < z * 2) {\n' +
                '        c = c + x + 5;\n' +
                '        return x + y + z + c;\n' +
                '    } else {\n' +
                '        c = c + z + 5;\n' +
                '        return x + y + z + c;\n' +
                '    }\n' +
                '}\n','1,2,3'),
            '<p>function foo(x, y, z){</p> \n' +
            '<p style=\'background-color:#fc3320\'>if  ((((x + 1) + y) < z)) {</p> \n' +
            '<p>return (((x + y) + z) + (0 + 5));</p> \n' +
            '<p>}</p> \n' +
            '<p style=\'background-color:#4ff955\'>else if  ((((x + 1) + y) < (z * 2))) {</p> \n' +
            '<p>return (((x + y) + z) + ((0 + x) + 5));</p> \n' +
            '<p>}</p> \n' +
            '<p>else {</p> \n' +
            '<p>return (((x + y) + z) + ((0 + z) + 5));</p> \n' +
            '<p>}</p> \n' +
            '<p>}</p> \n'
        );
    });


    it('is parsing test #2 aviram', () => {// 2
        assert.equal(
            getTextFinished('function foo(x, y, z){\n' +
                '    let a = x + 1;\n' +
                '    let b = a + y;\n' +
                '    let c = 0;\n' +
                '    \n' +
                '    while (a < z) {\n' +
                '        c = a + b;\n' +
                '        z = c * 2;\n' +
                '    }\n' +
                '    \n' +
                '    return z;\n' +
                '}\n','1,2,3'),
            '<p>function foo(x, y, z){</p> \n' +
            '<p>while (((x + 1) < z)) {</p> \n' +
            '<p>z = (((x + 1) + ((x + 1) + y)) * 2);</p> \n' +
            '<p>}</p> \n' +
            '<p>return z;</p> \n' +
            '<p>}</p> \n' +
            ''
        );
    });
    it('is parsing arrays', () => {// 3
        assert.equal(
            getTextFinished('let x = 5;\n' +
                'x=x/5;\n' +
                'x=x-1;\n' +
                'x=14\n' +
                'function gg(){\n' +
                'let w =[1,2,3];\n' +
                '\n' +
                'if(w[1]>6){\n' +
                'return -1}\n' +
                'else if (w[2]<100){\n' +
                'return w[0];\n' +
                '}\n' +
                'return "5"\n' +
                '\n' +
                '}',''),
            '<p>let x = 5;</p> \n' +
            '<p>x = 1;</p> \n' +
            '<p>x = 0;</p> \n' +
            '<p>x = 14;</p> \n' +
            '<p>function gg(){</p> \n' +
            '<p style=\'background-color:#fc3320\'>if  ((2 > 6)) {</p> \n' +
            '<p>return - (1);</p> \n' +
            '<p>}</p> \n' +
            '<p style=\'background-color:#4ff955\'>else if  ((3 < 100)) {</p> \n' +
            '<p>return 1;</p> \n' +
            '<p>}</p> \n' +
            '<p>return "5";</p> \n' +
            '<p>}</p> \n' +
            ''
        );
    });
    it('is parsing statements without {}', () => {// 4
        assert.equal(
            getTextFinished('let w = [1,2,"3",\'4\'];\n' +
                'w[1]=w[0]+1;\n' +
                'function gg (g){\n' +
                'if(g[0]>6)\n' +
                'return 5;\n' +
                'else\n' +
                'return -g[1];\n' +
                '\n' +
                'while(1>3)\n' +
                'return g[2];\n' +
                '\n' +
                'return 1;\n' +
                '}','[1,2,3]'),
            '<p>let w = [1,2,"3",\'4\'];</p> \n' +
            '<p>w[1] = 2;</p> \n' +
            '<p>function gg (g){</p> \n' +
            '<p style=\'background-color:#fc3320\'>if  ((g[0] > 6))</p> \n' +
            '<p>return 5;</p> \n' +
            '<p>else</p> \n' +
            '<p>return - (g[1]);</p> \n' +
            '<p>while ((1 > 3))</p> \n' +
            '<p>return g[2];</p> \n' +
            '<p>return 1;</p> \n' +
            '<p>}</p> \n' +
            ''
        );
    });
    it('is parsing unary statemnt at if', () => {// 5
        assert.equal(
            getTextFinished('function gg (y){\n' +
                'var x;\n' +
                'x=5;\n' +
                'if(!(-5<5))\n' +
                '{\n' +
                'return y;\n' +
                '}\n' +
                'else if (-5<5){\n' +
                'return 7;\n' +
                '}\n' +
                '\n' +
                'if(6>4){\n' +
                'return 4\n' +
                '}\n' +
                '}','3'),
            '<p>function gg (y){</p> \n' +
            '<p style=\'background-color:#fc3320\'>if  (! ((- (5) < 5))) {</p> \n' +
            '<p>return y;</p> \n' +
            '<p>}</p> \n' +
            '<p style=\'background-color:#4ff955\'>else if  ((- (5) < 5)) {</p> \n' +
            '<p>return 7;</p> \n' +
            '<p>}</p> \n' +
            '<p>if  ((6 > 4)) {</p> \n' +
            '<p>return 4;</p> \n' +
            '<p>}</p> \n' +
            '<p>}</p> \n' +
            ''
        );
    });
    it('is parsing with a stop at coloring', () => {// 6
        assert.equal(
            getTextFinished('function ggd (){\n' +
                'if(5>3)\n' +
                'return 3;\n' +
                'else if(3>7){\n' +
                'return 3;\n' +
                '}\n' +
                'else{\n' +
                'return 6;}\n' +
                '\n' +
                'return -6\n' +
                '}',''),
            '<p>function ggd (){</p> \n' +
            '<p style=\'background-color:#4ff955\'>if  ((5 > 3))</p> \n' +
            '<p>return 3;</p> \n' +
            '<p>else if  ((3 > 7)) {</p> \n' +
            '<p>return 3;</p> \n' +
            '<p>}</p> \n' +
            '<p>else {</p> \n' +
            '<p>return 6;</p> \n' +
            '<p>}</p> \n' +
            '<p>return - (6);</p> \n' +
            '<p>}</p> \n'
        );
    });
    it('is parsing array at params', () => {// 7
        assert.equal(
            getTextFinished('function ggd (x,y){\n' +
                'if(5>3)\n' +
                'x=x+4;\n' +
                'else if(y[2]>3){\n' +
                'return 3;\n' +
                '}\n' +
                'else{\n' +
                'return 6;}\n' +
                '\n' +
                'return -6;\n' +
                '}','1,[5,2,7]'),
            '<p>function ggd (x,y){</p> \n' +
            '<p style=\'background-color:#4ff955\'>if  ((5 > 3))</p> \n' +
            '<p>x = (x + 4);</p> \n' +
            '<p>else if  ((y[2] > 3)) {</p> \n' +
            '<p>return 3;</p> \n' +
            '<p>}</p> \n' +
            '<p>else {</p> \n' +
            '<p>return 6;</p> \n' +
            '<p>}</p> \n' +
            '<p>return - (6);</p> \n' +
            '<p>}</p> \n'
        );
    });
    it('is parsing array from args #1', () => {// 8
        assert.equal(
            getTextFinished('function ggd (x,y,z,args){\n' +
                'if(5>3)\n' +
                'x=x+4;\n' +
                'else if(x>3){\n' +
                'return 3;\n' +
                '}\n' +
                'else{\n' +
                'return 6;}\n' +
                'return -6;\n' +
                '}','1.5,true,\'gg\',[\'d\',\'dd\',false,1.5]'),
            '<p>function ggd (x,y,z,args){</p> \n' +
            '<p style=\'background-color:#4ff955\'>if  ((5 > 3))</p> \n' +
            '<p>x = (x + 4);</p> \n' +
            '<p>else if  ((x > 3)) {</p> \n' +
            '<p>return 3;</p> \n' +
            '<p>}</p> \n' +
            '<p>else {</p> \n' +
            '<p>return 6;</p> \n' +
            '<p>}</p> \n' +
            '<p>return - (6);</p> \n' +
            '<p>}</p> \n'
        );
    });
    it('is parsing array from args #2', () => { //9
        assert.equal(
            getTextFinished('let aree;\n' +
                'aree = 1+(aree+3);\n' +
                'aree= aree +(-5);\n' +
                'function ggd (x,y,z,args){\n' +
                'if(5>3)\n' +
                'x=x+4;\n' +
                'else if(x>3){\n' +
                'return 3;\n' +
                '}\n' +
                'else{\n' +
                'return 6;}\n' +
                'return -6;\n' +
                '}','1.5,false,\'gg\',[\'d\',\'dd\',true,1.5]'),
            '<p>let aree;</p> \n' +
            '<p>aree = 4;</p> \n' +
            '<p>aree = -1;</p> \n' +
            '<p>function ggd (x,y,z,args){</p> \n' +
            '<p style=\'background-color:#4ff955\'>if  ((5 > 3))</p> \n' +
            '<p>x = (x + 4);</p> \n' +
            '<p>else if  ((x > 3)) {</p> \n' +
            '<p>return 3;</p> \n' +
            '<p>}</p> \n' +
            '<p>else {</p> \n' +
            '<p>return 6;</p> \n' +
            '<p>}</p> \n' +
            '<p>return - (6);</p> \n' +
            '<p>}</p> \n'
        );
    });
    it('is parsing globals at the end', () => { //10
        assert.equal(
            getTextFinished('let x=4;\n' +
                'function gg ()\n' +
                '{\n' +
                'return 5;\n' +
                '}\n' +
                'x=x+7;',''),
            '<p>let x=4;</p> \n' +
            '<p>function gg ()</p> \n' +
            '<p>return 5;</p> \n' +
            '<p>}</p> \n' +
            '<p>x = 11;</p> \n'
        );
    });

});
