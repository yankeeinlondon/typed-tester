import commandLineArgs, {OptionDefinition, CommandLineOptions} from "command-line-args";
import { 
  AfterFirst, 
  Dictionary, 
  ExpandDictionary, 
  First, 
  If, 
  isString, 
  IsUndefined 
} from "inferred-types";

export type Option = OptionDefinition & { description?: string; typeLabel?: string; };
export const COMMANDS = ["test", "diagnostics", "deps", "graph"] as const;
export type Command = typeof COMMANDS[number];

export const isCommand = (val: unknown): val is Command => {
  return isString(val) && COMMANDS.includes(val as any);
}

/**
 * used to define CLI variable as a numeric array
 */
export const NumericArray = (): number[] => [];

export const command_descriptions = {
  test: `Looks at your test files and identifies type errors in them`,
  deps: `Lists the dependant symbols each symbol in your source tree depends on. You can add filtering glob patterns to only report on a subset of `,
  diagnostics: ``,
  graph: ``
} satisfies Record<typeof COMMANDS[number], string>;

const CMD = {name: "cmd", type: String, defaultOption: true, multiple: false};

export const command_options = {
  test: [
    CMD,
    {
      name: "filter", alias: "f", typeLabel: "glob",
      type: String, description: `only evaluate tests which contain the filter string` 
    },
    {
      name: "clear", alias: "c", defaultValue: false,
      type: Boolean, description: `clear the cache prior to analyzing`
    },
    {
      name: "quiet", alias: "q", defaultValue: false,
      type: Boolean, description: `quiet stdout output to a minimum`
    },
    {
      name: "watch", alias: "w", defaultValue: false,
      type: Boolean, description: `run in watch mode`
    },
    {
      name: "ignore",  alias: "i",  defaultValue: [], multiple: true,
      type: Number, description: `TS error codes that just be downgraded to just warnings`
    },
    {
      name: "config", typeLabel: "filepath",
      type: String, description: `explicitly state which tsconfig file to use`
    },
  ],
  diagnostics: [
    CMD,
  ],
  deps: [
    CMD,
    { name: "filter", type: String, alias: "f", description: `only report on symbols which match filter string` },
    { name: "json", type: Boolean, description: `output JSON to stdout rather than screen friendly format`}
  ],
  graph: [CMD]
} as const satisfies  Record<typeof COMMANDS[number], Option[]>;

export const global_options = [
  { 
    name: "verbose", type: Boolean, alias: "v", defaultValue: false,
    description: `more verbose output when analyzing`
  },
  { 
    name: "help", alias: "h", type: Boolean, defaultValue: false,
    description: `this help menu` 
  },
] as const satisfies Option[];

type FromConstructor<
  TVal extends ((input: string) => any) | undefined,
  TDef,
  TMulti extends boolean | undefined
> = TVal extends typeof String
? If<IsUndefined<TDef>, string | undefined, string>
: TVal extends typeof Boolean
? If<IsUndefined<TDef>, boolean | undefined, boolean>
: TVal extends typeof Number
? TMulti extends true
  ? If<IsUndefined<TDef>, number[] | undefined, number[]>
  : If<IsUndefined<TDef>, number | undefined, number>
: TVal extends typeof Date
? If<IsUndefined<TDef>, Date | undefined, Date>
: TVal extends typeof NumericArray ? number[]
: If<IsUndefined<TDef>, string | undefined, string>;

type _AsOption<
  T extends readonly Option[],
  Results extends Dictionary = {}
> = [] extends T
? ExpandDictionary<Results>
: _AsOption<
    AfterFirst<T>,
    Results & Record<
      First<T>["name"], 
      FromConstructor<
        First<T>["type"],
        First<T>["defaultValue"],
        First<T>["multiple"]
      >
    >
  >;

export type AsOption<
  TCmd extends Command,
> = {
  cmd: TCmd;
} & _AsOption<
  [
    ...typeof command_options[TCmd], 
    ...typeof global_options
  ]
>;

export type CommandOptions = {
  test: AsOption<"test">,

}


export type CliResponse = [Command, CommandLineOptions] | [undefined, CommandLineOptions];

export const create_cli = (): CliResponse =>  {
  const argv = process.argv[2]?.split(" ") || [];
  const cmd_candidate: string = argv[0] || "not-command";

  return isCommand(cmd_candidate)
  ? [
      cmd_candidate,
      commandLineArgs(
        [
          ...command_options[cmd_candidate],
          ...global_options
        ],
        { stopAtFirstUnknown: true }
      )
  ]
  : [
      undefined,
      commandLineArgs(
        global_options,
        { stopAtFirstUnknown: true }
      )
  ];
}
