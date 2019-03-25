/**
 * @copyright (c) 2016 Joas Schilling <coding@schilljs.com>
 *
 * @author Joas Schilling <coding@schilljs.com>
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later. See the COPYING file.
 */

/* global t, escapeHTML */

import _ from 'lodash'

export default {
	avatarsEnabled: true,

	fileTemplate: require('./templates/file.handlebars'),

	userLocalTemplate: require('./templates/userLocal.handlebars'),
	userRemoteTemplate: require('./templates/userRemote.handlebars'),

	unknownTemplate: require('./templates/unkown.handlebars'),
	unknownLinkTemplate: require('./templates/unkownLink.handlebars'),

	/**
	 * @param {string} message The rich object message with placeholders
	 * @param {Object} parameters The rich objects to be parsed into the message
	 * @returns {string} The HTML to render this message
	 */
	parseMessage: function(message, parameters) {
		message = escapeHTML(message)
		var self = this
		var regex = /\{([a-z\-_0-9]+)\}/gi
		var matches = message.match(regex)

		_.each(matches, function(parameter) {
			parameter = parameter.substring(1, parameter.length - 1)
			if (!parameters.hasOwnProperty(parameter) || !parameters[parameter]) {
				// Malformed translation?
				console.error('Potential malformed ROS string: parameter {' + parameter + '} was found in the string but is missing from the parameter list')
				return
			}

			var parsed = self.parseParameter(parameters[parameter])
			message = message.replace('{' + parameter + '}', parsed)
		})

		return message.replace(new RegExp('\n', 'g'), '<br>')
	},

	/**
	 * @param {Object} parameter      Rich Object
	 * @param {string} parameter.type Type of the object
	 * @param {string} parameter.id   Identifier of the object
	 * @param {string} parameter.name Name of the object
	 * @param {string} parameter.link Absolute link to the object
	 * @param {string} [parameter.server] Server the user is on
	 * @param {string} [parameter.path] User visible path of the file
	 * @returns {string} The HTML to render this object
	 */
	parseParameter: function(parameter) {
		switch (parameter.type) {
		case 'file':
			return this.parseFileParameter(parameter).trim('\n')

		case 'user':
			if (_.isUndefined(parameter.server)) {
				return this.userLocalTemplate(parameter).trim('\n')
			}

			return this.userRemoteTemplate(parameter).trim('\n')

		default:
			if (!_.isUndefined(parameter.link)) {
				return this.unknownLinkTemplate(parameter).trim('\n')
			}

			return this.unknownTemplate(parameter).trim('\n')
		}
	},

	/**
	 * @param {Object} parameter      Rich Object file
	 * @param {string} parameter.id   Numeric ID of the file
	 * @param {string} parameter.name Name of the file/folder
	 * @param {string} parameter.path User visible path of the file
	 * @param {string} parameter.link Absolute link to the file
	 * @returns {string} The HTML to render this parameter
	 */
	parseFileParameter: function(parameter) {
		var lastSlashPosition = parameter.path.lastIndexOf('/')
		var firstSlashPosition = parameter.path.indexOf('/')
		parameter.path = parameter.path.substring(firstSlashPosition === 0 ? 1 : 0, lastSlashPosition)

		return this.fileTemplate(_.extend(parameter, {
			title: parameter.path.length === 0 ? '' : t('notifications', 'in {path}', parameter)
		}))
	}
}
