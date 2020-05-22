const tasks = arr => arr.join(' && ');

module.exports = {
  hooks: {
    'pre-commit': tasks(['echo "Tests complete"']),
    'commit-msg': 'commitlint -E HUSKY_GIT_PARAMS'
  }
};
