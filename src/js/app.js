import $ from 'jquery';
import {getTextFinished} from './code-analyzer';

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let vars= $('#parameterInput').val();
        var table = document.getElementById('grandTable');
        var row = table.rows[1];
        var cell = row.cells[1];
        cell.innerHTML=getTextFinished(codeToParse,vars);
    });
});
