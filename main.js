$(function () {
  const chatInput = $('.chat-input');
  const inputSendBtn = $('#inputSendBtn');
  const listEntry = $('.list-entry');

  chatInput.keyup(function () {
    if (chatInput.val().length > 0) {
      inputSendBtn.removeClass('a-unpopped');
      inputSendBtn.addClass('a-popped');
    } else {
      inputSendBtn.addClass('a-unpopped');
      inputSendBtn.removeClass('a-popped');
    }
  })

  listEntry.on("click", function () {
    listEntry.removeClass('selected');
    $(this).addClass('selected')
  })

  $(document).mouseup(function (e) {
    var container = $(".quick-action-menu");

    if (!container.is(e.target) &&
      container.has(e.target).length === 0) {
      container.addClass('hide');
    }
  });

  $('._3iZxC').on('click', function () {
    if ($('._3iZxC').hasClass('_7SGVl')) {
      $('#hotLeadLabel').removeClass('hide');
    } else {
      $('#hotLeadLabel').addClass('hide');
    }
  })

  $('#hotLeadLabel').on('click', function () {
    $('#hotLeadLabel').addClass('hide');
    $('._3iZxC').removeClass('_7SGVl').addClass('_1dp0d')
  })

  $(".list").sortable({
    revert: 100,
    delay: 50,
    connectWith: '.list',
    start: handleSortStart,
    stop: handleSortStop
  });

  $(document).click(function () {
    closeDropdowns();
  })

  $('.btn-wrapper').on('click', addNewCardSection);

  $('[data-hook="header-close-button"]').click(function () {
    $('.modal-wrapper').fadeOut(200);
    setTimeout(() => {
      $(this).closest('.modal').hide();
    }, 300);
  })

  $('.view-form-submission').click(function () {
    $('#formSubmissionModal').show();
    $('.modal-wrapper').fadeIn(200);
  })


  let willForwardCardOnSubmit = true;

  $("#inputSendBtn").click(function () {
    if (willForwardCardOnSubmit) {
      setTimeout(() => {
        moveCardToNextList();
        willForwardCardOnSubmit = false;
      }, 1600);
    }

  });

  $('#hiddenNextBtn').click(function () {
    if ($('.dropdown-layout-wrapper ._2KJVQ').attr('data-list') == "eventsList") {
      moveCardToNextList();
    } else {
      jobApplyFlow();
    }

  })

  updateCardCount();

  let jobAppStages = 1;

  function jobApplyFlow() {

    const formDetailsArr = [
      "Amy",
      "Sandberg",
      "asand1986@colmail.com",
      "987-654-321",
      1,
      "02.01.2019",
      1,
      "https://wix.com/asand_cv.html"
    ]

    const formfields = document.getElementById('formIframe').contentWindow.$('#comp-jou4mvguform input, #comp-jou4mvguform select');

    switch (jobAppStages) {
      case 1: //show phone
        $('.iphone8plus').removeClass('away');
        break;
      case 2: // fill form
        for (let i = 0; i < formfields.length; i++) {
          setTimeout(() => {
            let currFormField = $(formfields[i]);
            currFormField.val(formDetailsArr[i]);

            if (currFormField.is('select')) {
              let options = currFormField.find('option');

              currFormField.css('color', 'black');

              options.removeAttr('selected');
              $(options[formDetailsArr[i]]).attr('selected', 'true');

            }
          }, 180 * i);
        }
        break;
      case 3: //submit form and add applicant
        for (let i = 0; i < formfields.length; i++) {
          let currFormField = $(formfields[i]);
          currFormField.val('');

          if (currFormField.is('select')) {
            let options = currFormField.find('option');

            currFormField.css('color', '#999');

            options.removeAttr('selected');
            $(options[0]).attr('selected', 'true');
          }
        }
        setTimeout(() => {
          document.getElementById('formIframe').contentWindow.$('.submit-message').fadeIn(200);
        }, 200);

        setTimeout(() => {
          $('#cvReceivedList').prepend(createNewCard("Amy Sandberg", "AS", "Job application"));
          $('#cvReceivedList').sortable("refresh");

          setTimeout(() => {
            $('#cardAS .inner-card').addClass('pulse');

            setTimeout(() => {
              $('#cardAS .inner-card').removeClass('pulse');
            }, 600);

          }, 150);


        }, 2200);
        break;
      case 4: //hide phone
        $('.iphone8plus').addClass('away');
        jobAppStages = 0;
        break;

    }
    jobAppStages++
  }


  function moveCardToNextList() {
    const hCard = $('#heroCard');
    const nextList = hCard.closest('.list-wrapper').next('.list-wrapper').find('.list');

    if (nextList)
      moveCardTo(hCard, nextList);
    setTimeout(() => {
      $('#heroCard .inner-card').addClass('pulse');
      setTimeout(() => {
        $('#heroCard .inner-card').removeClass('pulse');
      }, 600);

      if (nextList.closest('.list-wrapper').attr('data-list-type') == 'wonList') {
        $('#wonModal').show();
        $('.modal-wrapper').fadeIn(200);
        initConfetti();
      }


    }, 150);
  }

  function closeDropdowns() {
    $('._2jl_n._3-IFc._2TxPY').removeClass('_2uczM');
    $('._2XqXP').removeClass('_22w6r');
  }

  function handleSortStart() {
    disableClick = true;
  }

  function handleSortStop(event, ui) {
    checkIfWonList(event, ui);
    updateCardCount();
    disableClick = false;
  }

  function addNewCardSection() {
    const parentList = $(event.target).closest('.list-wrapper').find('.list');
    const newCardSection = `
    <div class="new-card-section-wrapper">
      <h3>New Card</h3>
      <div data-hook="formfield-children" class="_3EZc6">
    <div>
        <div data-input-parent="true" class="_1zSu8">
            <div class="_2jl_n _3-IFc _2TxPY">
                <div class="_38xAk"><input class="_1d_nr _1ym20" value="" maxlength="524288" placeholder="Select contact"
                        type="text" autocomplete="off" style="text-overflow: clip;">
                    <div class="_2l5k7">
                        <div class="_1gxlY">
                            <div class="_2mQ8g">
                                <div class="Q_34e"><svg viewBox="0 0 10 6" fill="currentColor" width="10" height="6">
                                        <path d="M5 4.1L.7 0 0 .7l5 4.9 5-4.9-.7-.7z"></path>
                                    </svg></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div data-hook="dropdown-layout-wrapper" style="margin-left: 0px;">
            <div tabindex="-1" class="Uj_W0">
                <div class="_2XqXP _2jtHB _3D1DZ" style="max-height: 260px;">
                    <div class="pWPlT" data-hook="dropdown-layout-options" style="max-height: 225px;">
                        <div class="XrGXu _1Qdua">
                          <div class="name">Avner Rosenan</div>
                          <div class="email">avnerr@wix.com</div>
                        </div>
                        <div class="XrGXu _1Qdua">
                          <div class="name">Avner Rosenan</div>
                          <div class="email">avnerr@wix.com</div>
                        </div>
                        <div class="XrGXu _1Qdua">
                          <div class="name">Avner Rosenan</div>
                          <div class="email">avnerr@wix.com</div>
                        </div>
                    </div>
                    <div class="cRRes new-contact-btn">
                      + New Contact
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
    </div>
    `;

    parentList.append(newCardSection);
    parentList.find('._3EZc6').click(function (e) {
      e.preventDefault();
      e.stopPropagation();
      $(this).find('._2jl_n').addClass('_2uczM');
      $(this).find('._2XqXP').addClass('_22w6r');
    })

    parentList.find('.XrGXu').click(function (e) {
      e.preventDefault();
      e.stopPropagation();
      $(this).parent().find('.XrGXu').removeClass('_2KJVQ')
      $(this).addClass('_2KJVQ');
      $('._1d_nr').val($(this).find('.name').text());
      closeDropdowns();
    })

    parentList.find('.new-contact-btn').click(function (e) {
      $('#newContactModal').show();
      $('.modal-wrapper').fadeIn(200);
    })
  }


  $('.list-dropdown').click(function (e) {
    e.preventDefault();
    e.stopPropagation();
    $(this).find('._2XqXP').addClass('_22w6r');
  })

  $('.list-dropdown').find('.XrGXu').click(function (e) {
    e.preventDefault();
    e.stopPropagation();
    $(this).parent().find('.XrGXu').removeClass('_2KJVQ')
    $(this).addClass('_2KJVQ');
    const newVal = $.trim($(this).text().replace(/ /gm, ""));
    $('.list-dropdown ._1d_nr').val($.trim(newVal));
    $('.list-dropdown ._1d_nr').css("width", "0");
    $('.list-dropdown ._1d_nr').css("width", $('.list-dropdown ._1d_nr')[0].scrollWidth + "px")

    const newList = $(this).attr('data-list');

    handleListSwitch($('#' + newList));
    closeDropdowns();
  })

  function handleListSwitch(listId) {
    $('.lists-container').addClass('hide');
    listId.removeClass('hide');
  }

  function createNewCard(name, initials, source) {
    return `
    <div id="card${initials}" class="ui-state-default card ooopen-cp-btn">
    <div class="inner-card">
        <div class="user-card-title">
            Birthday for Sum, Brooklyn
        </div>
        <div class="main-info">
            <div class="avatar">
                <img src="./images/a3.jpg" alt="">
            </div>
            <div class="user-meta">
                <h3>${name}</h3>
                <p>Source: ${source}</p>
            </div>
        </div>
        <div class="bottom-info">
            <span class="create-time">Created today</span>
            <div class="due-date hide">
                <svg viewBox="0 0 17 17" version="1.1" xmlns="http://www.w3.org/2000/svg"
                    xmlns:xlink="http://www.w3.org/1999/xlink">
                    <g id="UX" stroke="none" stroke-width="1" fill="none"
                        fill-rule="evenodd">
                        <g id="2-copy-3" transform="translate(-802.000000, -215.000000)">
                            <g id="Group-14" transform="translate(594.000000, 203.000000)">
                                <g id="Group-13">
                                    <g id="Group-8">
                                        <g id="Group-17" transform="translate(198.000000, 2.000000)">
                                            <g id="Group-19">
                                                <rect id="BG-Copy-3"
                                                    fill-opacity="0"
                                                    fill="#FFFFFF"
                                                    x="0" y="0"
                                                    width="37"
                                                    height="37" rx="18"></rect>
                                                <g id="Group-15"
                                                    transform="translate(11.000000, 11.000000)"
                                                    stroke="#162D3D">
                                                    <circle id="Oval-7"
                                                        cx="7.5" cy="7.5"
                                                        r="7.5"></circle>
                                                    <path d="M7.5,8.5 L7.5,4.5"
                                                        id="Line-2"
                                                        stroke-linecap="square"></path>
                                                    <path d="M7.5,8.5 L9.52819725,8.5"
                                                        id="Line-2"
                                                        stroke-linecap="square"></path>
                                                </g>
                                            </g>
                                        </g>
                                    </g>
                                </g>
                            </g>
                        </g>
                    </g>
                </svg>
                Jan 22
            </div>
        </div>
    </div>
</div>
      `;
  }

  function moveCardTo(card, targetList) {
    card.prependTo($(targetList));
    targetList.sortable('refresh');
  }

  function checkIfWonList(event, ui) {
    const listParent = $(ui.item).closest('.list-wrapper');

    if (listParent.attr('data-list-type') == 'wonList') {
      $('#wonModal').show();
      $('.modal-wrapper').fadeIn(200);
      initConfetti();
    }
  }

  for (var i = 0; i < 350; i++) {
    create(i);
  }

  function initConfetti() {
    for (var i = 0; i < 350; i++) {
      drop(i);
    }
  }

  function create(i) {
    var width = Math.random() * 8;
    var height = width * .6;
    var colourIdx = Math.ceil(Math.random() * 3);
    var colour = "red";
    switch (colourIdx) {
      case 1:
        colour = "yellow";
        break;
      case 2:
        colour = "blue";
        break;
      default:
        colour = "red";
    }
    $('<div class="confetti-' + i + ' ' + colour + '"></div>').css({
      "width": width + "px",
      "height": height + "px",
      "top": -Math.random() * 60 - 40 + "%",
      "left": Math.random() * 100 + "%",
      "opacity": Math.random() + 0.5,
      "transform": "rotate(" + Math.random() * 360 + "deg)",
      "z-index": "11"
    }).appendTo('body');
  }

  function drop(x) {
    $('.confetti-' + x).animate({
      top: "100%",
      left: "+=" + Math.random() * 15 + "%"
    }, Math.random() * 1800 + 1500, function () {
      reset(x);
    });
  }

  function reset(x) {
    $('.confetti-' + x).css({
      "top": -Math.random() * 60 - 40 + "%",
      "left": "-=" + Math.random() * 15 + "%"
    }, 0, function () {
      //drop(x);             
    });
  }

  function updateCardCount() {
    const listsWrappers = $('.list-wrapper');

    listsWrappers.each(function () {
      const cardCounter = $(this).find('.card-count');
      const cards = $(this).find('.card');

      cardCounter.html(cards.length);
    })
  }

})