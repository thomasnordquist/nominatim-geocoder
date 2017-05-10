module.exports = {
    "env": {
        "browser": true,
        "es6": true,
        "commonjs": true,
        "jasmine": true
    },
    "plugins": [
      "jasmine"
    ],
    "extends": "airbnb/base",
    //"extends": "eslint:recommended",
    "parserOptions": {
        "sourceType": "module",
        "ecmaVersion": 6
    },
    "globals" : {
        "require": false
    },
    "rules": {
        "indent": [
            "warn",
            2
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "warn",
            "single"
        ],
        "semi": [
            "warn",
            "never"
        ],
        "no-unused-vars": [
            "warn"
        ],
        "no-use-before-define": "error",
        "class-methods-use-this": "off",
        "object-shorthand": "error",
        "no-console": "error",
        "prefer-template" : "off",
        "no-param-reassign": [
          "error"
        ],
        "no-restricted-syntax": [
            "error"
        ],
        "consistent-return": "off",
        "import/no-extraneous-dependencies": "off",
        "no-unused-expressions": "off",
        'array-bracket-spacing': ['error', 'never']
    }
};
