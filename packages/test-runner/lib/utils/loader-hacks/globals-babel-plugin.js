function isCalleeTest(t, callee) {
  return (
    t.isIdentifier(callee, {
      name: 'test',
    }) ||
    (t.isMemberExpression(callee) &&
      t.isIdentifier(callee.object, {
        name: 'test',
      }))
  )
}

function getProgramChild(path) {
  if (path.parentPath && path.parentPath.type !== 'Program') {
    return getProgramChild(path.parentPath)
  }
  return path
}

module.exports = function babelPluginTestInjector({ types: t }) {
  return {
    visitor: {
      ExpressionStatement(path) {
        const { expression } = path.node
        if (t.isCallExpression(expression)) {
          const { callee } = expression
          if (isCalleeTest(t, callee) && !path.scope.hasBinding('test')) {
            const { injected } = path.hub.file.opts
            if (!injected) {
              const programBody = getProgramChild(path)
              path.hub.file.opts.injected = true // eslint-disable-line

              /**
               * LOGS
               */

              // var __skpm_logs__ = []
              programBody.insertBefore(
                t.variableDeclaration('var', [
                  t.variableDeclarator(
                    t.identifier('__skpm_logs__'),
                    t.arrayExpression([])
                  ),
                ])
              )

              // var __skpm_console_log__ = console.log
              programBody.insertBefore(
                t.variableDeclaration('var', [
                  t.variableDeclarator(
                    t.identifier('__skpm_console_log__'),
                    t.memberExpression(
                      t.identifier('console'),
                      t.identifier('log')
                    )
                  ),
                ])
              )

              // var __hookedLogs = function (string) { __skpm_logs__.push(string); return __skpm_console_log__(string) }
              programBody.insertBefore(
                t.variableDeclaration('var', [
                  t.variableDeclarator(
                    t.identifier('__hookedLogs'),
                    t.functionExpression(
                      null,
                      [t.identifier('string')],
                      t.blockStatement([
                        t.expressionStatement(
                          t.callExpression(
                            t.memberExpression(
                              t.identifier('__skpm_logs__'),
                              t.identifier('push')
                            ),
                            [t.identifier('string')]
                          )
                        ),
                        t.returnStatement(
                          t.callExpression(
                            t.identifier('__skpm_console_log__'),
                            [t.identifier('string')]
                          )
                        ),
                      ])
                    )
                  ),
                ])
              )

              /**
               * TEST
               */

              // var __skpm_tests__ = {}
              programBody.insertBefore(
                t.variableDeclaration('var', [
                  t.variableDeclarator(
                    t.identifier('__skpm_tests__'),
                    t.objectExpression([])
                  ),
                ])
              )

              /**
               *
               * var test = function (description, fn) => {
               *   function withLogs(context, document) {
               *     console.log = __hookedLogs
               *     return fn(context, document)
               *   }
               *   __skpm_tests__[description] = withLogs
               * }
               */
              programBody.insertBefore(
                t.variableDeclaration('var', [
                  t.variableDeclarator(
                    t.identifier('test'),
                    t.functionExpression(
                      null,
                      [t.identifier('description'), t.identifier('fn')],
                      t.blockStatement([
                        t.functionDeclaration(
                          t.identifier('withLogs'),
                          [t.identifier('context'), t.identifier('document')],
                          t.blockStatement([
                            t.expressionStatement(
                              t.assignmentExpression(
                                '=',
                                t.memberExpression(
                                  t.identifier('console'),
                                  t.identifier('log')
                                ),
                                t.identifier('__hookedLogs')
                              )
                            ),
                            t.returnStatement(
                              t.callExpression(t.identifier('fn'), [
                                t.identifier('context'),
                                t.identifier('document'),
                              ])
                            ),
                          ])
                        ),
                        t.expressionStatement(
                          t.assignmentExpression(
                            '=',
                            t.memberExpression(
                              t.identifier('__skpm_tests__'),
                              t.identifier('description'),
                              true
                            ),
                            t.identifier('withLogs')
                          )
                        ),
                      ])
                    )
                  ),
                ])
              )

              // test.only = function (description, fn) { fn.only = true; return test(description, fn) }
              programBody.insertBefore(
                t.expressionStatement(
                  t.assignmentExpression(
                    '=',
                    t.memberExpression(
                      t.identifier('test'),
                      t.identifier('only')
                    ),
                    t.functionExpression(
                      null,
                      [t.identifier('description'), t.identifier('fn')],
                      t.blockStatement([
                        t.expressionStatement(
                          t.assignmentExpression(
                            '=',
                            t.memberExpression(
                              t.identifier('fn'),
                              t.identifier('only')
                            ),
                            t.booleanLiteral(true)
                          )
                        ),
                        t.returnStatement(
                          t.callExpression(t.identifier('test'), [
                            t.identifier('description'),
                            t.identifier('fn'),
                          ])
                        ),
                      ])
                    )
                  )
                )
              )

              // test.skip = function (description, fn) { fn.skipped = true; return test(description, fn) }
              programBody.insertBefore(
                t.expressionStatement(
                  t.assignmentExpression(
                    '=',
                    t.memberExpression(
                      t.identifier('test'),
                      t.identifier('skip')
                    ),
                    t.functionExpression(
                      null,
                      [t.identifier('description'), t.identifier('fn')],
                      t.blockStatement([
                        t.expressionStatement(
                          t.assignmentExpression(
                            '=',
                            t.memberExpression(
                              t.identifier('fn'),
                              t.identifier('skipped')
                            ),
                            t.booleanLiteral(true)
                          )
                        ),
                        t.returnStatement(
                          t.callExpression(t.identifier('test'), [
                            t.identifier('description'),
                            t.identifier('fn'),
                          ])
                        ),
                      ])
                    )
                  )
                )
              )

              /**
               * EXPORTS
               */

              // export {__sketch_tests__ as tests, __sketch_logs__ as logs }
              programBody.insertBefore(
                t.exportNamedDeclaration(null, [
                  t.exportSpecifier(
                    t.identifier('__skpm_tests__'),
                    t.identifier('tests')
                  ),
                  t.exportSpecifier(
                    t.identifier('__skpm_logs__'),
                    t.identifier('logs')
                  ),
                ])
              )
            }
          }
        }
      },
    },
  }
}
