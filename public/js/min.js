
 Highcharts.setOptions({
    lang: {
        thousandsSep: ','
    }
});

function hashDifficultyMarket( period )
{
    Highcharts.getJSON(
        'https://www.pega-hq.com/api/pegapool-hashrate?period='+period,
        function (data) {
    
            Highcharts.setOptions({
                lang: {
                    thousandsSep: ','
                }
            });
            
            Highcharts.chart('hash-difficulty-market', {
                chart: {
                    styledMode: true,
                    marginBottom: 10,
                    marginTop: 10,
                    height:200
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
                legend: {
                    layout: 'horizontal',
                    align: 'center',
                    x: 0,
                    verticalAlign: 'bottom',
                    y: 10,
                    floating: false
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
                    }
                ],
                series: [{
                    name: 'Hash',
                    type: 'area',
                    yAxis: 0,
                    data: data,
                    marker: {
                        symbol: 'circle',
                        radius: 4,
                        lineWidth: 5
                      },
                    tooltip: {
                        valueSuffix: ' TH/s',
                        valueDecimals:2
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
                                spacingBottom: -200,
                                spacingLeft: 0,
                                plotBorderWidth: 0,
                                margin: [0,0,0,0],
                                marginTop: 0
                            },
                            legend: {
                                align: 'center',
                                verticalAlign: 'top',
                                layout: 'horizontal',
                                y:-20
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

        }   

    );
}




$(document).ready(function(){
    hashDifficultyMarket( '1year' );

 });

