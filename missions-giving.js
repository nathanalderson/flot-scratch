$(function() {

var placeholder = $("#placeholder");

function getAmount() {
    var amount = $("#amount").val();
    if (amount[0] == '$')
        amount = amount.substring(1);
    return parseFloat(amount)
}

function dollarString(num) {
    return "$"+(Math.round(num*100)/100).toFixed(2)
}

function calculate(amount, sbcChecked, cbfChecked, fbcChecked) {
    var data = {};

    fbc_auto_percent = (2/12);
    fbc_auto_amount = amount * fbc_auto_percent;
    data['fbc-auto'] = {data: fbc_auto_amount, ordinal: 10};

    mba_auto_percent = 0;
    mba_auto_amount = amount * mba_auto_percent;
    data['mba-auto'] = {data: mba_auto_amount, ordinal: 20};

    amount = amount - mba_auto_amount - fbc_auto_amount;

    var orgs   = ['sbc', 'cbf', 'fbc'];
    var checks = [sbcChecked, cbfChecked, fbcChecked];

    // how many are checked?
    var numChecked = 0;
    numChecked += sbcChecked ? 1 : 0;
    numChecked += cbfChecked ? 1 : 0;
    numChecked += fbcChecked ? 1 : 0;

    // if none checked, it's all undesignated
    if (numChecked == 0)
        data['undesignated'] = {data: amount, ordinal: 25};

    // compute totals for each org
    var sbcTotal = sbcChecked ? (amount/numChecked) : 0;
    var cbfTotal = cbfChecked ? (amount/numChecked) : 0;
    var fbcTotal = fbcChecked ? (amount/numChecked) : 0;
    data['cbf-total'] = {data: cbfTotal, ordinal: 30};
    data['sbc-total'] = {data: sbcTotal, ordinal: 40};
    data['fbc-total'] = {data: fbcTotal, ordinal: 50};

    // sbc details
    sbc_state_percent    = 0.57;
    sbc_state_amount     = data['sbc-total'].data * sbc_state_percent;
    sbc_national_amount  = data['sbc-total'].data - sbc_state_amount;
    data['sbc-national'] = {data: sbc_national_amount, ordinal: 41};
    data['sbc-state']    = {data: sbc_state_amount, ordinal: 42};

    // cbf details
    cbf_state_percent    = 0.20;
    cbf_state_amount     = data['cbf-total'].data * cbf_state_percent;
    cbf_national_percent = 0.50;
    cbf_national_amount  = data['cbf-total'].data * cbf_national_percent;
    cbf_asc_amount       = data['cbf-total'].data - cbf_national_amount - cbf_state_amount; // earmarked
    data['cbf-national'] = {data: cbf_national_amount, ordinal: 31};
    data['cbf-state']    = {data: cbf_state_amount, ordinal: 32};
    data['cbf-asc']      = {data: cbf_asc_amount, ordinal: 33};

    return data;
}

function getColor(label) {
    var alpha;
    if (/total/.test(label) || /national/.test(label)) {
        alpha = 0.8;
    }
    else if (/state/.test(label) || /auto/.test(label)) {
        alpha = 0.65;
    }
    else {
        alpha = 0.4;
    }

    var color;
    if(/mba/.test(label))
        color = "rgba(192, 80 , 77 , " + alpha + ")";
    else if (/fbc/.test(label))
        color = "rgba(79 , 129, 189, " + alpha + ")";
    else if (/sbc/.test(label) || /asc/.test(label))
        color = "rgba(128, 100, 162, " + alpha + ")";
    else if (/cbf/.test(label))
        color = "rgba(155, 187, 89 , " + alpha + ")";
    else
        color = "rgba(0  , 0  , 0  , " + alpha + ")";

    return color;
}

function getLabel(label) {
    var full_label;
    if(label == "fbc-auto")
        full_label = "First Baptist Missions (2% automatic)"
    else if (label == "fbc-total")
        full_label = "First Baptist Missions"
    else if (label == "sbc-total")
        full_label = "Southern Baptist Convention"
    else if (label == "cbf-total")
        full_label = "Cooperative Baptist Fellowship"
    else if (label == "sbc-national")
        full_label = "SBC National"
    else if (label == "sbc-state")
        full_label = "SBC State Board of Missions"
    else if (label == "cbf-national")
        full_label = "CBF National Organization"
    else if (label == "cbf-state")
        full_label = "CBF State Organization"
    else if (label == "cbf-asc")
        full_label = "SBC State Board of Missions*"
    else
        full_label = label;
    return full_label;
}

function addColors(data) {
    $.each(data, function(k, v) {
        data[k].color = getColor(k);
    });
    return data;
}

function addLabels(data) {
    $.each(data, function(k, v) {
        data[k].label = getLabel(k);
    });
    return data;
}

function sortAndReshape(data, detail) {
    var piedata = [];
    // filter and place in array
    $.each(data, function(k, v) {
        if (/auto/.test(k) || /undesignated/.test(k))
            piedata.push(v);
        else if (!detail && /total/.test(k))
            piedata.push(v);
        else if (detail && (/fbc/.test(k) || !/total/.test(k)))
            piedata.push(v);
    });

    // sort
    piedata.sort(function(a, b) { return a.ordinal - b.ordinal; });

    return piedata;
}

function drawPlot(data) {
    function labelFormatter(label, series) {
        return "<div id='label'>" + label + "<br/>" + dollarString(series.data[0][1]) + "</div>";
    }

    plot = $.plot(placeholder, data, {
        series: {
            pie: {
                show: true
              , radius: 1
              , label: {
                    show: true,
                    radius: 3/4,
                    formatter: labelFormatter,
                    color: "#000",
                    background: {
                        opacity: 0.2
                       , color: '#000'
                    }
                }
            }
        }
      , legend: {
          show: false
        }
      , grid: {
          hoverable: true,
          clickable: true
        }
    });
}

function redraw() {
    placeholder.unbind();

    var amount = getAmount();
    var missionsAmount = amount * 0.12
    $("#toMissionsAmount").text(dollarString(missionsAmount));

    var sbcChecked = $("#sbc-checkbox").is(":checked")
    var cbfChecked = $("#cbf-checkbox").is(":checked")
    var fbcChecked = $("#fbc-checkbox").is(":checked")
    var detailChecked = $("#detail-checkbox").is(":checked")

    data = calculate(missionsAmount, sbcChecked, cbfChecked, fbcChecked);
    data = addColors(data);
    data = addLabels(data);
    data = sortAndReshape(data, detailChecked);

    drawPlot(data);
}

$(document).ready(function() { redraw(); });
$(".orgCheckbox").change(function() { redraw(); });
$("#detail-checkbox").change(function() { redraw(); });
$("#amount").change(function() { redraw(); });
$("#amount").spinner({
    min: 0,
    step: 10,
    start: 100,
    numberFormat: "C",
});
$("#amount").on("spinstop", function() { redraw(); });
$(document).on("plothover", "#placeholder", function(event, pos, obj) {
    if (!obj) {
        return;
    }
    var percent = parseFloat(obj.series.percent).toFixed(2);
    $("#hover").text("Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.");
    // $("#hover").text("<span id='popup' style='color:" + obj.series.color + "'>" + obj.series.label + " (" + percent + "%)</span>");
});

}); // $(function() {
