# `ts-type-tester`

> a type-testing tool that helps you incorporate these tests into your CI/CD solution

## Installation

```sh
npm install -D ts-type-tester
```

## Usage

You can interactively use the tool by running:

```sh
npx ts-tester [tests-folder]
```

But in general it is recommended to add a _script_ to your `package.json`:

```json
"scripts": {
    "test:types": "ts-tester [test-folder]"
}
```

There are configuration options available if you want to go beyond the basics and 
the best way to get an overview of this is to just run:

```sh
npx ts-tester
```

Without any parameters this will bring up the help system which describes all command line switches.
