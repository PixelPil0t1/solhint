const semver = require('semver')
const BaseChecker = require('../base-checker')
const { severityDescription } = require('../../doc/utils')

const DEFAULT_SEVERITY = 'warn'
const BASE_VERSION = '>=0.8.4'
const ruleId = 'gas-custom-errors'
const meta = {
  type: 'gas-consumption',

  docs: {
    description:
      'Enforces the use of Custom Errors over Require with strings error and Revert statements',
    category: 'Gas Consumption Rules',
    options: [
      {
        description: severityDescription,
        default: DEFAULT_SEVERITY,
      },
    ],
    notes: [
      {
        note: 'This rules applies to Solidity version 0.8.4 and higher',
      },
    ],
    examples: {
      good: [
        {
          description: 'Use of Custom Errors',
          code: 'revert CustomErrorFunction();',
        },
        {
          description: 'Use of Custom Errors with arguments',
          code: 'revert CustomErrorFunction({ msg: "Insufficient Balance" });',
        },
        {
          description: 'Use of Require with Custom Error with arguments',
          code: 'require(success, CustomErrorFunction({ msg: "Insufficient Balance" });',
        },
        {
          description: 'Use of Require with function call and Custom Error',
          code: 'require(isAuthorized(account), CustomErrorFunction();',
        },
        {
          description: 'Use of Require with binary comparison and Custom Error',
          code: 'require(a > b, CustomErrorFunction();',
        },
      ],
      bad: [
        {
          description: 'Use of require statement',
          code: 'require(userBalance >= availableAmount, "Insufficient Balance");',
        },
        {
          description: 'Use of plain revert statement',
          code: 'revert();',
        },
        {
          description: 'Use of revert statement with message',
          code: 'revert("Insufficient Balance");',
        },
      ],
    },
  },

  isDefault: false,
  recommended: true,
  defaultSetup: DEFAULT_SEVERITY,

  schema: null,
}

class GasCustomErrorsChecker extends BaseChecker {
  constructor(reporter) {
    super(reporter, ruleId, meta)
    this.solidityVersion = 0
  }

  isVersionGreater() {
    return semver.intersects(this.solidityVersion, BASE_VERSION)
  }

  PragmaDirective(node) {
    if (node.type === 'PragmaDirective' && node.name === 'solidity') {
      this.solidityVersion = node.value
    }
  }

  FunctionCall(node) {
    let errorStr = ''
    if (this.isVersionGreater(node)) {
      // added second part of conditional to be able to use require with Custom Errors
      if (node.expression.name === 'require' && node.arguments[1].type !== 'FunctionCall') {
        errorStr = 'require'
      } else if (
        node.expression.name === 'revert' &&
        (node.arguments.length === 0 || node.arguments[0].type === 'StringLiteral')
      ) {
        errorStr = 'revert'
      }

      if (errorStr !== '') {
        this.error(node, `GC: Use Custom Errors instead of ${errorStr} statements`)
      }
    }
  }
}

module.exports = GasCustomErrorsChecker
