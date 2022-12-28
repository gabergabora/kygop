
$(document).ready( function() {
    $.ajax({
        method: "get",
        url: "data.json"
    })
    .done(function( msg ) {
        $("#miners_val").html(msg.worker_length);
        $("#hashrate_val").html(msg.hashrate +' <span>EH/s</span>');
        $("#energy_val").html(msg.energy + ' <span>MW</span>');
        $("#mined_val").html(msg.paid + ' <span>BTC</span>');
        $("#value_last_day").html(msg.value_last_day + ' <span>BTC</span>');

        $("#miners_val_2").html(msg.worker_length);
        $("#hashrate_val_2").html(msg.hashrate +' <span>EH/s</span>');
        $("#energy_val_2").html(msg.energy + ' <span>MW</span>');
        $("#mined_val_2").html(msg.paid + ' <span>BTC</span>');
        $("#value_last_day_2").html(msg.value_last_day + ' <span>BTC</span>');

        $("#miners_val_text").html(msg.worker_length+' ASICs online');
        $("#hashrate_val_text").html(msg.hashrate +' EH/s')
        $("#energy_val_txt").html(msg.energy + ' MW');
        $("#energy_val_2_txt").html(msg.energy + ' MW of renewable energy');
        $("#mined_val_txt").html(msg.paid + ' <span> BTC mined in total</span>')
    });


    $.ajax({
        method: "get",
        url: "https://www.pega-hq.com/api/additional-stats-website"
    })
    .done(function( data ) {
       $("#current_network_hashrate").html(data.current_network_hashrate+'<strong>EH/s</strong>')
       $("#current_network_hashrate_height").height(data.current_network_hashrate );
    });
});