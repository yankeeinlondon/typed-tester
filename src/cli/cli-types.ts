import { OptionDefinition } from "command-line-args";
import { 
  AfterFirst, 
  Dictionary, 
  ExpandDictionary, 
  First, 
  If,  
  IsUndefined 
} from "inferred-types";
import { command_options, global_options } from "./options";

/**
 * **Option**
 * 
 * Combines the definition of an option from `command-line-args` but adds props 
 * which `command-line-usage` understands so that you can have one complete definition 
 * of an option.
 */
export type Option = OptionDefinition & { description?: string; typeLabel?: string; };

/**
 * A valid command for the CLI
 */
export type Command = keyof typeof command_options;


type FromConstructor<
  TVal extends ((input: string) => any) | undefined,
  TDef,
  TMulti extends boolean | undefined
> = TVal extends typeof String
? TMulti extends true
  ? If<IsUndefined<TDef>, string[] | undefined, string[]>
  : If<IsUndefined<TDef>, string | undefined, string>
: TVal extends typeof Boolean
? If<IsUndefined<TDef>, boolean | undefined, boolean>
: TVal extends typeof Number
? TMulti extends true
  ? If<IsUndefined<TDef>, number[] | undefined, number[]>
  : If<IsUndefined<TDef>, number | undefined, number>
: TVal extends typeof Date
? If<IsUndefined<TDef>, Date | undefined, Date>
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
  TCmd extends Command | null,
> = TCmd extends null
? _AsOption<typeof global_options> & { cmd: string }

: TCmd extends Command
? {cmd: TCmd } & _AsOption<
    [
      ...typeof command_options[TCmd], 
      ...typeof global_options
    ]
  >
: never;

export type CommandOptions = {
  test: AsOption<"test">,
  symbols: AsOption<"symbols">,

}
