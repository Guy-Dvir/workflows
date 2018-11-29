$(function () {

  /**
   * Global vars
   */

  const animationEasing = {
    duration: 200,
    easing: $.bez([0.39, 0.16, 0.34, 0.99])
  };

  /**
   *  cache DOM elements
   */
  const chatInput = $(".chat-input");
  const inputSendBtn = $("#inputSendBtn");
  const inputButtons = $(".input-button");
  const inputTooltip = $(".input-button-tooltip");
  const inputWrapper = $(".input-wrapper");
  const savedRepliesKeyboard = $("#savedReplies");
  const sr_KeyboardItems = $("#savedReplies .keyboardItem");
  const bk_KeyboardItems = $("#services .keyboardItem");
  const ck_KeyboardItems = $("#cart .keyboardItem");
  const keyboardActions = $("#keyboardActions");
  const chatRoom = $('[data-hook="chat-room"]');
  const savedRepliesBtn = $(".savedReplies");
  const servicesBtn = $(".booking");
  const cartBtn = $(".cart");
  const msgList = $(".message-list");
  const servicesKeyboard = $("#services");
  const cartKeyboard = $("#cart");
  const keyboardTray = $("#keyboardTray");
  const sliderBtnLeft = $(".sliderBtnLeft");
  const sliderBtnRight = $(".sliderBtnRight");
  const foldBtn = $(".foldBtn");

  /**
   * init function
   */

  init();

  function init() {
    //invoke on init
    //adjustMsgsPadding();

    //bind events
    chatInput.on("keyup", handleInputKeyup);
    chatInput.on("keydown", handleInputKeydown);
    inputSendBtn.on("click", handleInputSubmit);
    sr_KeyboardItems.on("click", handleSavedRepliesClick);
    bk_KeyboardItems.on("click", handleImgItemClick);
    ck_KeyboardItems.on("click", handleImgItemClick);
    sliderBtnLeft.on("click", handleSliderLeftBtnClick);
    sliderBtnRight.on("click", handleSliderRightBtnClick);
    foldBtn.on("click", handleFoldClick);

    inputWrapper.on("click", function () {
      event.stopPropagation();
    });

    servicesBtn.on("click", function () {
      handleKeyboardToggle(servicesKeyboard, $(this));
    });

    cartBtn.on("click", function () {
      handleKeyboardToggle(cartKeyboard, $(this));
    })

    savedRepliesBtn.on("click", function () {
      handleKeyboardToggle(savedRepliesKeyboard, $(this));
    });

    inputButtons.hover(
      function () {
        const buttonPos = $(this).offset();
        const x = buttonPos.left - $(this).width() / 2 - 18;
        const y = buttonPos.top - $(this).height() / 2 - 42;
        inputTooltip.css({
          top: y + "px",
          left: x + "px"
        });

        if ($(this).hasClass("active")) {
          inputTooltip.text("close");
        } else {
          inputTooltip.text($(this).attr("data-tooltip-text"));
        }

        inputTooltip.removeClass("hide");
      },
      function () {
        inputTooltip.addClass("hide");
      }
    );

    //window events
    $(window).on("click", handleClickOutside);
    $(window).on("resize", handleWindowResizeEvent);

  }

  /**
   * main functions
   */

  function handleClickOutside() {
    const keyboard = $(".is-open");
    if (keyboard && keyboard.length > 0) {
      keyboard.removeClass("is-open");
      keyboard.slideUp(animationEasing);
      inputWrapper.removeClass("openKeyboard");
      inputButtons.removeClass("active");
    }
  }

  function handleFoldClick() {
    const assocKeyboardName = $(this)
      .parent()
      .attr("id");
    const assocKeyboard = $(".input-button." + assocKeyboardName);

    assocKeyboard.click();
  }

  function handleWindowResizeEvent() {
    //adjustMsgsPadding();
  }

  function handleSliderLeftBtnClick() {
    const currWrapperW = inputWrapper.width();
    const innerItemsWrapper = $(this)
      .closest(".keyboardWrapper")
      .find(".clipper");
    const items = $(this)
      .closest(".keyboardWrapper")
      .find(".keyboardItem");
    const itemW = $(items[0]).outerWidth();

    let lastShownItem = null;
    let lastShownItemIndex;
    let currMarginL = parseInt(
      innerItemsWrapper.css("margin-left").replace(/[^-\d\.]/g, "")
    );

    for (let i = 0; i < items.length; i++) {
      if ($(items[i]).position().left + itemW > currWrapperW) {
        lastShownItem = items[i];
        lastShownItemIndex = i;
        break;
      }
    }

    if (lastShownItem) {
      let moveLeft = currMarginL - (itemW + 15);
      innerItemsWrapper.animate({
        marginLeft: moveLeft + "px"
      }, animationEasing);

      if (moveLeft == -(itemW * (lastShownItemIndex - 1))) {
        sliderBtnLeft.addClass("hide");
      }
    }

    if (currMarginL - (itemW + 15) + innerItemsWrapper.width() < currWrapperW) {
      sliderBtnLeft.addClass("hide");
    }

    if (currMarginL - itemW < 0) {
      sliderBtnRight.removeClass("hide");
    }
  }

  function handleSliderRightBtnClick() {
    const currWrapperW = inputWrapper.width();
    const innerItemsWrapper = $(this)
      .closest(".keyboardWrapper")
      .find(".clipper");
    const items = $(this)
      .closest(".keyboardWrapper")
      .find(".keyboardItem");
    const itemW = $(items[0]).outerWidth();

    let currMarginL = parseInt(
      innerItemsWrapper.css("margin-left").replace(/[^-\d\.]/g, "")
    );

    let moveRight = currMarginL + (itemW + 15);

    innerItemsWrapper.animate({
      marginLeft: moveRight + "px"
    }, animationEasing);

    if (currMarginL + (itemW + 15) >= 0) {
      sliderBtnRight.addClass("hide");
    }

    if (currMarginL + (itemW + 15) + innerItemsWrapper.width() > currWrapperW) {
      sliderBtnLeft.removeClass("hide");
    }
  }

  function handleKeyboardToggle(keyboard, btn) {
    const innerItemsWrapper = $(".clipper");

    if (inputWrapper.hasClass("openKeyboard")) {
      if (keyboard.hasClass("is-open")) {
        keyboard.removeClass("is-open");
        keyboard.slideUp(animationEasing);
        inputWrapper.removeClass("openKeyboard");
        inputButtons.removeClass("active");
        inputTooltip.text(btn.attr("data-tooltip-text"));
        innerItemsWrapper.css("margin-left", "0px");
        sliderBtnLeft.removeClass("hide");
        sliderBtnRight.addClass("hide");
      } else {
        $(".keyboardWrapper:not(#keyboardTray)").hide();
        inputButtons.removeClass("active");
        innerItemsWrapper.css("margin-left", "0px");
        sliderBtnLeft.removeClass("hide");
        sliderBtnRight.addClass("hide");
        btn.addClass("active");
        inputTooltip.text("close");
        inputWrapper.addClass("openKeyboard");

        if (
          $(".is-open").length == 1 &&
          $(".is-open").attr("id") == "keyboardTray"
        ) {
          keyboard.slideDown(animationEasing);
        } else {
          keyboard.show();
        }
        $(".keyboardWrapper:not(#keyboardTray)").removeClass("is-open");
        keyboard.addClass("is-open");
      }
    } else {
      $(".keyboardWrapper:not(#keyboardTray)").hide();
      $(".keyboardWrapper:not(#keyboardTray)").removeClass("is-open");
      inputButtons.parent().removeClass("active");
      btn.addClass("active");
      inputTooltip.text("close");
      keyboard.slideDown(animationEasing);
      keyboard.addClass("is-open");
      inputWrapper.addClass("openKeyboard");
    }
  }

  function handleInputKeyup() {
    if (chatInput.text().length > 0 || keyboardTray.children().length > 0) {
      chatInput.removeClass("placeholder");
      inputSendBtn.removeClass("a-unpopped");
      inputSendBtn.addClass("a-popped");
      keyboardActions.css("width", "auto");
    } else {
      chatInput.addClass("placeholder");
      inputSendBtn.addClass("a-unpopped");
      inputSendBtn.removeClass("a-popped");
      setTimeout(() => {
        keyboardActions.css("width", "225px");
      }, 100);
    }
  }

  function handleInputKeydown(e) {
    if (e.which == 13 && !e.shiftKey) {
      inputSendBtn.click();
      return false;
    }
  }

  function handleSavedRepliesClick() {
    const msgContent = $(this)
      .find("p")
      .text();
    chatInput.text(
      chatInput.text() + $.trim(msgContent.replace(/[\t\n{1,}]+/g, " "))
    );
    if (!keyboardTray.hasClass("is-open")) {
      inputWrapper.removeClass("openKeyboard");
    }
    savedRepliesKeyboard.hide();
    handleInputKeyup();
    inputButtons.removeClass("active");
  }

  function handleImgItemClick(e) {
    $(this)
      .clone()
      .appendTo(keyboardTray)
      .on("click", handleTrayClick);
    $('.keyboardWrapper').hide();
    keyboardTray.show();
    inputButtons.parent('.input-buttons').addClass('reduced');
    $(".keyboardWrapper:not(#keyboardTray)").removeClass("is-open");
    keyboardTray.addClass("is-open");
    inputSendBtn.removeClass("a-unpopped");
    inputSendBtn.addClass("a-popped");
    keyboardActions.css("width", "auto");
    inputButtons.removeClass("active");
  }

  function handleTrayClick() {
    $(this).remove();
    if (keyboardTray.children().length == 0) {
      keyboardTray.hide();
      inputButtons.parent('.input-buttons').removeClass('reduced');
    }
    if (
      !servicesKeyboard.hasClass("is-open") &&
      !savedRepliesKeyboard.hasClass("is-open")
    ) {
      inputWrapper.removeClass("openKeyboard");
    }

    if (chatInput.text().length == "") {
      inputSendBtn.addClass("a-unpopped");
      inputSendBtn.removeClass("a-popped");
    }
  }

  function handleInputSubmit() {
      const msgContent = chatInput.text();

      if (keyboardTray.children().length > 0) {
        keyboardTray.children().each(function () {
          $(".newMsgsWrapper").append($(this).clone());
          $(this).remove();
          keyboardTray.hide();
          $(".keyboardWrapper:not(#keyboardTray)").removeClass("is-open");
          inputWrapper.removeClass("openKeyboard");
          inputButtons.parent('.input-buttons').removeClass('reduced');
        });
      }

      if (msgContent != "") {
        $(".newMsgsWrapper").append(createMsg(msgContent));
      }

      chatInput.text("");
      handleInputKeyup();

      var objDiv = document.querySelector(".message-list");
      objDiv.scrollTop = objDiv.scrollHeight;

      inputButtons.removeClass("active");
  

  }

  function adjustMsgsPadding() {
    let paddingVal = (chatRoom.width() - inputWrapper.width() + 34) / 2;
    msgList.css("padding", "0 " + paddingVal + "px");
  }

  function createMsg(content) {
    return `
          <div data-hook="message-list-item" class="user-message-list-item _3lV_F">
          <div data-hook="chat-message-wrapper">
              <div data-hook="chat-message" aria-live="polite" class="chat-message _14-C- _-2_B6 undefined "
                  data-message-position="left">
                  <div data-hook="bubble" class="bubble user-bubble">
                      <div data-hook="timestamp-tooltip">
                          <div data-hook="plain-text-bubble-wrapper"
                              class="plain-text-bubble-wrapper right-point _1cmue undefined">
                              ${content} 
                          </div>
                      </div>
                  </div>
              </div>
          </div>
          </div>
          `;
  }
});