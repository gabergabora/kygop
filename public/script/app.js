const bars = document.getElementsByClassName("navtoggle");
var x;
        const sidebar = document.querySelector(".navbar");
        const toggleOff = document.querySelector(".fa-toggle-off");
        const toggleOn = document.querySelector(".fa-toggle-on");
        const content = document.querySelector(".contentbox");

        // js script to toogle sidebar on and off

        for (x = 0; x < bars.length; x++) {
        bars[x].addEventListener("click", function() {
            sidebar.classList.toggle("hide-navbar");
            sidebar.classList.toggle("show-navbar");
            content.classList.toggle("fullcontentbox");
            toggleOn.classList.toggle("fa-toggle-on");
            toggleOn.classList.toggle("fa-toggle-off");
        });
        }


        

function myFunction() {
     var copyText = document.getElementById("copy");
     copyText.select();
     copyText.setSelectionRange(0, 99999);
    navigator.clipboard
    .writeText(copyText.value)
    .then(() => {
        alert("successfully copied");
    })
    .catch(() => {
        alert("something went wrong");
    });
}