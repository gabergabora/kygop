getPoolSignups();
$.ajax({
    method: "get",
    url: "https://www.pega-hq.com/api/rank-pool"
})
.done(function( data ) {
    $("#rank_badge").html(data['btc-com_rank']+'<span>th</span>')
    $("#rank-btc").html(data['btc-com_rank']);
    
});

let th = 0;
let usd = 0;
$(document).ready( function() {
    $.ajax({
        method: "get",
        url: "https://www.pega-mining.co.uk/pegapool.php"
    })
    .done(function( data ) {
        $("#pool-hashrate").html(data.pegapool_global_hashrate);
        $("#blocks_mined").html(data.total_blocks_mined);
        $("#blocks_mined_btc").html(data.total_blocks_mined_btc);
        $("#daily_revenue").html('$'+data.fpps_usd);

        $("#bitcoin-pool-hash").html(data.pegapool_global_hashrate);
        $("#bitcoin-global-hash").html(data.global_hashrate);
        $("#bitcoin-usd").html(data.price_usd);
        $("#bitcoin-rev-th_usd").html(data.fpps_usd);

      
        $("#btc_rev_th").html(data.fpps+' BTC');
        $("#btc_rev_th_usd").html('$'+data.fpps_usd);
        th = data.fpps;
        usd = data.fpps_usd;
    });

    $.ajax({
        method: "get",
        url: "https://public.ecologi.com/users/pegapool/impact"
    })
    .done(function( data ) {
        $("#tree_amount").html(data.trees.toLocaleString());

        
        var co2 = parseFloat(parseFloat(data.trees)*parseFloat(26.635))/parseFloat(1000);
        co2 = parseInt(co2);
        $("#carbon-offset").html(co2.toLocaleString());
    });

    $(".copy-clipboard").click(function(){
        copyToClipboard($(this).parent().find('textarea'));
    });
   
    btcData();


    $(document).on('keyup change','#th_calc', function(){
        if( $(this).val() >= 1 )
        {
            let rev_total =  parseFloat(parseFloat(th)*parseFloat($(this).val())).toFixed(8);
           

            let usd_total = parseFloat(parseFloat(usd)*parseFloat($(this).val())).toFixed(4)
           

            $("#btc_rev_th").html(rev_total+' BTC');
            $("#btc_rev_th_usd").html('$'+usd_total );
        }else
        {
            $("#btc_rev_th").html(th+' BTC');
            $("#btc_rev_th_usd").html('$'+usd);
        }
        
     });

     


});


function  btcData()
{

    

    $.ajax({
        method: "get",
        url: "https://www.pega-hq.com/api/bitcoin-website-stats"
    })
    .done(function( data ) {
        $("#difficulty").html(data.difficulty+' T');
        $("#next_difficulty").html(data.next_difficulty);
        $("#next_difficulty_time").html(data.next_difficulty_change);

        Highcharts.chart('btc-chart', {
            chart: {
                styledMode: true,
                height:400,
                width:550,
                style:{filter:'alpha(opacity=10)',opacity:10,background:'transparent'}
            },
            title: {
                text: '',
            },
            xAxis: {
                type: 'datetime',
                crosshair: {
                    className:'crosshair-custom-style',
                },
                tickWidth: 0,
            },
            tooltip: {
                shared: true
            },
            navigation: {
                buttonOptions: {
                    enabled: true,
                    verticalAlign: 'top',
                    y: 0
                },
                buttons:{
                    contextButton:
                    {
                    
                        className:'highcharts-contextbutton',
                        enabled:true,
                        menuClassName:'highcharts-contextmenu',
                        menuItems:["viewFullscreen", "printChart", "separator", "downloadPNG", "downloadJPEG", "downloadPDF", "downloadSVG"]
                        
                    }
                    }
            },
            yAxis: [
                { 
                    visible: false,
                }, 
                {
                    visible: false,
                }
            ],
            series: [{
                name: 'Hash',
                type: 'area',
                yAxis: 0,
                data: data.chart.hashrate,
                marker: {
                    symbol: 'circle',
                    radius: 4,
                    lineWidth: 5
                  },
                tooltip: {
                    valueSuffix: ' TH/s'
                }
    
            }, {
                name: 'Market Price',
                type: 'area',
                yAxis: 1,
                data: data.chart.market_price,
                marker: {
                    symbol: 'circle',
                    radius: 4,
                    lineColor: 'white',
                    lineWidth: 5
                  },
                tooltip: {
                    valueDecimals: 2,
                    valuePrefix: '$'
                }
    
            }],defs: {
                glow: {
                    tagName: 'filter',
                    id: 'glow',
                    opacity: 0.5,
                    children: [{
                        tagName: 'feGaussianBlur',
                        result: 'coloredBlur',
                        stdDeviation: 2.5
                    }, {
                        tagName: 'feMerge',
                        children: [{
                            tagName: 'feMergeNode',
                            in: 'coloredBlur'
                        }, {
                            tagName: 'feMergeNode',
                            in: 'SourceGraphic'
                        }]
                    }]
                }
            },
            responsive: {
                rules: [{
                    condition: {
                        maxWidth: null,
                    },
                    chartOptions: {
                        chart:{
                            pacingRight: 0,
                            spacingLeft: 0,
                            plotBorderWidth: 0,
                            margin: [0,0,0,0],
                            marginTop: 0
                        },
                        legend: {
                            align: 'center',
                            verticalAlign: 'top',
                            layout: 'horizontal',
                            y:20
                        },
                        subtitle: {
                            text: null
                        },
                        credits: {
                            enabled: false
                        }
                    }
                }]
            }
         
        });

    });
}

function copyToClipboard(element) {
    var $temp = $("<input>");
    $("body").append($temp);
    $temp.val($(element).text()).select();
    document.execCommand("copy");
    $temp.remove();
}

function copyThis( txt )
{
    var $temp = $("<input>");
    $("body").append($temp);
    $temp.val(txt).select();
    document.execCommand("copy");
    $temp.remove();
}



function getPoolSignups(){
    $.ajax({
        method: "get",
        url: "https://www.pega-hq.com/api/pool-sign-ups-total"
    })
    .done(function( data ) {
        $("#sign-up-total").html(data.toLocaleString());
    });    
}



