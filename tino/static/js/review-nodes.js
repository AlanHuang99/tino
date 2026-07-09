const REPLY_CONTEXT_LENGTH = 90
const ELLIPSIS_WIDTH = 1

export const el = function el(tag, className, text = null) {
  const node = document.createElement(tag)
  if (className)
    node.className = className
  if (text !== null)
    node.textContent = text
  return node
}

const formatWhen = value => value ? new Date(value).toLocaleString() : ''

const shortenBody = function shortenBody(body) {
  if (body.length <= REPLY_CONTEXT_LENGTH)
    return body
  return `${body.slice(0, REPLY_CONTEXT_LENGTH - ELLIPSIS_WIDTH)}...`
}

const replyContextText = function replyContextText(message) {
  if (!message)
    return 'Replying to an earlier message'
  return `Replying to ${message.author}: ${shortenBody(message.body)}`
}

const targetReplyButton = function targetReplyButton(messageId) {
  const button = el('button', 'review-message-action', 'Reply')
  button.type = 'button'
  button.dataset.reviewAction = 'target-reply'
  button.dataset.reviewMessage = messageId
  return button
}

const messageHeader = function messageHeader(message, canReply) {
  const header = el('div', 'review-message-header')
  const meta = el(
    'div', 'review-message-meta', `${message.author} · ${formatWhen(message.created_at)}`,
  )
  header.appendChild(meta)
  if (canReply)
    header.appendChild(targetReplyButton(message.id))
  return header
}

const messageParentNode = function messageParentNode(message, messagesById) {
  const target = messagesById.get(message.reply_to_message_id)
  return el('div', 'review-message-parent', replyContextText(target))
}

const messageNode = function messageNode(message, messagesById, canReply) {
  const node = el('div', 'review-message')
  node.dataset.message = message.id
  node.appendChild(messageHeader(message, canReply))
  if (message.reply_to_message_id)
    node.appendChild(messageParentNode(message, messagesById))
  node.appendChild(el('div', 'review-message-body', message.body))
  return node
}

const anchorButton = function anchorButton(thread) {
  const text = `${thread.path}:${thread.anchor.line}:${thread.anchor.column}`
  const button = el('button', 'review-anchor', text)
  button.type = 'button'
  button.dataset.reviewAction = 'jump'
  return button
}

const threadActions = function threadActions(thread, openStatus) {
  const node = el('div', 'review-actions')
  const label = thread.status === openStatus ? 'Resolve' : 'Reopen'
  const action = thread.status === openStatus ? 'resolve' : 'reopen'
  const button = el('button', 'review-action-btn', label)
  button.type = 'button'
  button.dataset.reviewAction = action
  node.appendChild(button)
  return node
}

const threadHeader = function threadHeader(thread, canEdit, openStatus) {
  const header = el('div', 'review-thread-header')
  header.append(anchorButton(thread), el('span', 'review-status', thread.status))
  if (canEdit)
    header.appendChild(threadActions(thread, openStatus))
  return header
}

const replyContextNode = function replyContextNode() {
  const context = el('div', 'review-reply-context hidden')
  const label = el('span', 'review-reply-context-text')
  const clear = el('button', 'review-message-action', 'Cancel')
  clear.type = 'button'
  clear.dataset.reviewAction = 'cancel-target-reply'
  context.append(label, clear)
  return context
}

const replyInput = function replyInput() {
  const input = el('textarea', 'form-input review-reply-input')
  input.rows = 2
  input.placeholder = 'Reply...'
  return input
}

const replyButton = function replyButton() {
  const button = el('button', 'btn btn-secondary btn-small review-reply-button', 'Reply')
  button.type = 'button'
  button.dataset.reviewAction = 'reply'
  return button
}

const replyNode = function replyNode() {
  const reply = el('div', 'review-reply')
  reply.append(replyContextNode(), replyInput(), replyButton())
  return reply
}

const messagesNode = function messagesNode(thread, canReply, openStatus) {
  const messagesById = new Map(thread.messages.map(message => [message.id, message]))
  const messages = el('div', 'review-messages')
  for (const message of thread.messages) {
    const replyAvailable = canReply && thread.status === openStatus
    messages.appendChild(messageNode(message, messagesById, replyAvailable))
  }
  return messages
}

export const reviewThreadNode = function reviewThreadNode(thread, canEdit, openStatus) {
  const item = el('li', `review-thread review-${thread.status}`)
  item.dataset.thread = thread.id
  item.appendChild(threadHeader(thread, canEdit, openStatus))
  if (thread.anchor.quote)
    item.appendChild(el('blockquote', 'review-quote', thread.anchor.quote))
  item.appendChild(messagesNode(thread, canEdit, openStatus))
  if (canEdit && thread.status === openStatus)
    item.appendChild(replyNode())
  return item
}

const clearReplyTargetView = function clearReplyTargetView(item, label, context) {
  delete item.dataset.replyTarget
  label.textContent = ''
  context.classList.add('hidden')
}

const applyReplyTargetView = function applyReplyTargetView(item, label, context, message) {
  item.dataset.replyTarget = message.id
  label.textContent = replyContextText(message)
  context.classList.remove('hidden')
}

export const setReplyTargetView = function setReplyTargetView(item, message) {
  const context = item.querySelector('.review-reply-context')
  const label = item.querySelector('.review-reply-context-text')
  if (!context || !label)
    return
  if (message)
    applyReplyTargetView(item, label, context, message)
  else
    clearReplyTargetView(item, label, context)
}
