module.exports = function(m){
  if(
    !m ||
    !m.key ||
    !m.value ||
    !(m.value.type == 'chat/text' || m.value.type == 'chat/emote' || m.value.type == 'chat/topic') ||
    !m.value.content ||
    !m.value.content.channel ||
    !m.value.content.text ||
    !m.value.timestamp ||
    typeof m.value.timestamp !== 'number' ||
    m.value.timestamp > Date.now() + 1000 * 60 * 60 // if more than an hour in the future
  ){
    console.log('bad msg',m)
    return false;
  }

  return true;
}
