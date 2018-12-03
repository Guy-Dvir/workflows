$(document).ready(function () {

    const urlVars = getUrlVars();

    if (urlVars) {
        reactToUrl(urlVars)
    }

    adjustInputSize();

    const contactPanelBtn = $('#contactPanelBtn');

    //    open contact panel 
    //    $(".open-cp-btn").click(function(){
    $(document).on('click', '.open-cp-btn .main-info', function () {
        $(".contact-panel-container").addClass("show");
        contactPanelBtn.addClass('a-unpopped');
        contactPanelBtn.removeClass('a-popped');
    });

    $(".close-cp-btn").click(function () {
        $(".contact-panel-container").removeClass("show");
        // $(".chat-user-meta").removeClass("hide-text");
        contactPanelBtn.removeClass('a-unpopped');
        contactPanelBtn.addClass('a-popped');
    });

    //tabs
    $(".contact-panel-tabs .Gk_kE").click(function () {
        $(".contact-panel-tabs .Gk_kE").removeClass("_3HQru");
        $(this).addClass("_3HQru");

        let tabSelection;
        tabSelection = $(this).attr("value");
        $(".contact-card").addClass("hide");
        $(".contact-card." + tabSelection).removeClass("hide");
        $('.cards-container').scrollTop(0);
    });

    $('.cards-container').on("scroll", function (e) {
        // if ($(this).scrollTop() > 80) {
        //     collapseContactHeader(e)
        // } else {
        //     expandContactHeader(e)
        // }
    });

    const cph = $('.contact-panel-header');
    let isCollapsed = false;

    function collapseContactHeader(e) {
        if (!isCollapsed) {
            isCollapsed = true;
            cph.addClass('is-collapsed');
            $('.header-info .header-info-text').fadeOut(50).delay(110);
            $('.header-info--small').fadeIn(130);
        }
    }

    function expandContactHeader(e) {
        if (isCollapsed) {
            isCollapsed = false;
            cph.removeClass('is-collapsed');
            $('.header-info--small').fadeOut(50).delay(110);
            $('.header-info .header-info-text').fadeIn(130);
        }
    }


    //add-attachment
    let inputs = document.querySelectorAll('.inputfile');
    Array.prototype.forEach.call(inputs, function (input) {
        let label = input.nextElementSibling,
            labelVal = label.innerHTML;

        let newFile;

        input.addEventListener('change', function (e) {
            let fileName = '';
            if (this.files && this.files.length > 1) {
                fileName = (this.getAttribute('data-multiple-caption') || '').replace('{count}', this.files.length);
            } else {
                fileName = e.target.value.split('\\').pop();
            }

            if (fileName) {

                $(".info-tab").click();
                $(".cards-container").animate({
                    scrollTop: 850
                }, 300, 'linear');


                setTimeout(function () {
                    $(".card-box.card-attachments").addClass("pols");
                }, 350);

                setTimeout(function () {
                    $(".card-box.card-attachments").removeClass("pols");
                }, 800);


                //TODO add loader then show file name
                $(".card-attachments .card-section-content").append($('.card-attachments .card-section-content span:last-child').clone()).html();
                $(".card-attachments .card-section-content span:last-child span").html(fileName)
            }


        });


    });


    //add-label
    $(".card-box.card-labels .card-action").click(function () {
        $(".card-box.card-labels .add-label-container, .click-outside").removeClass("hide");
    });

    $(".click-outside").click(function () {
        $(".card-box.card-labels .add-label-container, .click-outside").addClass("hide");
    });



    //checkbox
    //    _7SGVl  - checked
    //    _1dp0d  - unchecked

    $("._1BmmA").click(function () {
        $(this).closest("._3iZxC").toggleClass("_7SGVl").toggleClass("_1dp0d");
    });


    //quick-actions
    $(".quick-actions-btn").click(function () {
        $(".quick-action-menu").toggleClass("hide");
    });


    $(".quick-action").click(function () {
        $(".quick-action-menu").addClass("hide");
    });


    $(".quick-action.add-label").click(function () {
        $(".info-tab").click();
        //        $(".scroll-label").scrollintoview({ duration: 300, direction: "y" });

        $(".cards-container").animate({
            scrollTop: 650
        }, 300, 'linear');


        setTimeout(function () {
            $(".card-box.card-labels").addClass("pols");
        }, 350);

        setTimeout(function () {
            $(".card-box.card-labels").removeClass("pols");
        }, 800);

        //$(".card-box.card-labels .card-action").click();
    });

    $(".quick-action.attach-file").click(function () {

        //                $(".card-attachments label.card-action").click();


        $('#file').click();


    });


    $(".quick-action.quick-task").click(function () {
        $(".task-note-tab").click();
        $('.cards-container').scrollTop(0);

        setTimeout(function () {
            $(".add-task").click();
        }, 200);

        setTimeout(function () {
            $(".card-tasks .card-section.animation-show.edit-mode").addClass("pols");
        }, 350);
        //        
        setTimeout(function () {
            $(".card-tasks .card-section.animation-show.edit-mode").removeClass("pols");
        }, 800);
    });

    $(".quick-action.quick-note").click(function () {
        $(".task-note-tab").click();
        $(".card-notes").scrollintoview({
            duration: 300,
            direction: "y"
        });


        setTimeout(function () {
            $(".add-note").click();
        }, 200);

        setTimeout(function () {
            $(".card-notes .card-section.animation-show.edit-mode").addClass("pols");
        }, 350);
        //        
        setTimeout(function () {
            $(".card-notes .card-section.animation-show.edit-mode").removeClass("pols");
        }, 800);

    });

    //    card-box card-labels




    //NOTES
    // from a jQuery collection
    autosize($('.card-notes textarea'));

    let noteTextInput;

    $(".add-note").click(function () {


        $(".card-notes .card-main").prepend($('.card-notes .card-main .card-section:first-child').clone()).html();

        $(".card-notes .card-main .card-section:first-child textarea").val("")

        $(".card-notes .card-main .card-section:first-child textarea").prop('placeholder', 'Write a note about this contact, e.g., One of our top clients');

        $(".card-notes .card-main .card-section:first-child .note-text").html("");

        $(".card-notes .card-main .card-section:first-child").addClass("edit-mode");
        $(".card-notes .card-main .card-section:first-child").addClass("animation-show");

        setTimeout(function () {
            $(".card-notes .card-main .card-section").removeClass("animation-show");

        }, 100);
        // from a jQuery collection
        autosize($('.card-notes textarea'));

    });

    $(document).on('click', '._3LGeM', function (e) {
        e.stopPropagation();
        e.preventDefault();

        $(this).hasClass('checked') ? $(this).removeClass('checked') : $(this).addClass('checked');
    })


    //   $(".edit-note").click(function(){
    $(document).on('click', '.edit-note, .note-text', function () {
        noteTextInput = $(this).closest(".card-section").find(".note-text").html();
        $(this).closest(".card-section").find("textarea").val(noteTextInput);

        $(this).closest(".card-section").find("textarea").focus();

        $(".card-section").removeClass("edit-mode");
        $(this).closest(".card-section").addClass("edit-mode");
    });

    //   $(".done-editing").click(function(){

    $(document).on('click', '.done-editing', function () {

        noteTextInput = $(this).closest(".card-section").find("textarea").val();
        $(this).closest(".card-section").find(".note-text").html(noteTextInput);
        $(this).closest(".card-section").removeClass("edit-mode");
    })


    // TASKS
    let taskTextInput;
    $(".add-task").click(function () {
        $(".card-section.edit-mode .save-editing").click();
        $(".card-tasks .card-main").prepend($('.card-tasks .card-main .card-section:first-child').clone()).html();
        $(".card-tasks .card-main .card-section:first-child ._3LGeM").removeClass('checked');
        $(".card-tasks .card-main .card-section:first-child textarea").val("");
        $(".card-tasks .card-main .card-section:first-child textarea").prop('placeholder', 'Write a task about this contact, e.g., One of our top clients');
        $(".card-tasks .card-main .card-section:first-child .task-text").html("");

        $(".card-tasks .card-main .card-section:first-child").addClass("edit-mode");
        $(".card-tasks .card-main .card-section:first-child").addClass("animation-show");

        setTimeout(function () {
            $(".card-tasks .card-main .card-section:first-child").removeClass("animation-show");
            $(".card-tasks .card-main .card-section:first-child textarea").focus();
        }, 50);
        // from a jQuery collection
        autosize($('.card-tasks textarea'));

    });

    //   $(".edit-task").click(function(){
    $(document).on('click', '.edit-task, .task-text, .card-tasks .card-section', function () {

        $(".card-section.edit-mode .save-editing").click();

        taskTextInput = $(this).closest(".card-section").find(".task-text").html();
        $(this).closest(".card-section").find("textarea").val(taskTextInput);

        $(this).closest(".card-section").find("textarea").focus();

        $(this).closest(".card-section").addClass("edit-mode");
    });

    //   $(".done-editing").click(function(){
    $(document).on('click', '.save-editing', function (e) {
        e.stopPropagation();
        e.preventDefault;

        taskTextInput = $(this).closest(".card-section").find("textarea").val();

        if (taskTextInput) {
            $(this).closest(".card-section").find(".task-text").html(taskTextInput);
            $(this).closest(".card-section").removeClass("edit-mode");
        } else {
            $(this).closest(".card-section").remove();
        }


    })

    $(window).on("resize", function () {
        //adjustInputSize();
    });


    function adjustInputSize() {
        const msgList = $(".message-list");
        const chatInput = $(".chat-input");

        if (msgList.outerWidth() <= 500) {
            chatInput.css("width", "100%");
        } else {
            chatInput.css("width", "initial");
        }
    }


    function getUrlVars() {
        var vars = {};
        var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
            vars[key] = value;
        });
        return vars;
    }


    function reactToUrl(urlVars) {
        if (urlVars.state) {
            // $(".contact-panel-container").addClass("show");
            // //$(".chat-user-meta").addClass("hide-text");

            // $('#contactDetailsMsg').removeClass('hide');
            // $('.message-list').addClass('known-user');
            // $('.visitorName').text("Avner Rosenan");
            // $('#chatUserMetaName').text("Avner Rosenan");
            // $('.visitorName').addClass("open-cp-btn");
            // $('.avatar-initials').text("AR");
            // $('#demoUser').find('.avatar-image').removeClass('unknown')
            // $('.message-list-item').removeClass('hide');
            // $('.chat-input').attr('data-placeholder', 'Message Avner Rosenan')
            // setTimeout(() => {
            // }, 150);
        }

        if (urlVars.state == "invoicesent") {
            $('#goBackToast').hide();
            setTimeout(() => {
                $('#successToast .toast-body').removeClass('collapsed');
            }, 1200);

            $('#invoiceSentMsg').removeClass('hide');

        } else if (urlVars.state == "pqsent") {
            $('#heroCard').detach().prependTo('#talkedList');
            setTimeout(() => {
                $('#heroCard').detach().prependTo('#priceQuoteList');

                setTimeout(() => {
                    $('#heroCard .inner-card').addClass('pulse');

                    setTimeout(() => {
                        $('#heroCard .inner-card').removeClass('pulse');
                    }, 600);

                }, 150);
            }, 1800);

        } else if (urlVars.state == "goback") {

        }
    }



});