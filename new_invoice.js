$(function () {

  const sendBtn = $('#sendBtn');
  const modalOverlay = $('.modal-overlay');
const modalClose = $('.modal-close');

  sendBtn.click(function () {
    modalOverlay.removeClass('hide');
  })

  modalClose.click(function () {
    modalOverlay.addClass('hide');
  })
})