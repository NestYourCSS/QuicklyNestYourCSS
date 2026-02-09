# All known bugs
## Bug #1
### Description:
The tool produces invalid CSS nesting when handling child combinators (`>`) or other combinators within a nested structure. Instead of correctly maintaining the relationship, it can produce broken selectors like `body > { ... }`, effectively stripping the tag name from the nested selector and attaching the combinator to the parent.

### Input:
```diff
+ | @media (max-aspect-ratio:1.097 / 1) {
+ |     body {
+ |     	> div {
+ |     		background: green;
+ |     		height: 100vh;
+ |     	}
+ |     	
+ |     	> figure {
+ |     		background: green;
+ |     		height: 100vh;
+ |     	}
+ |     }
+ | }
+ | 
+ | body {
+ | 	> div {
+ | 		background: green;
+ | 		height: 100vh;
+ | 	}
+ | 	
+ | 	> figure {
+ | 		background: green;
+ | 		height: 100vh;
+ | 	}
+ | }
```

### Output:
```diff
- | @media (max-aspect-ratio:1.097 / 1) {
- | 	body > {
- | 		div {
- | 			background: green;
- | 			height: 100vh;
- | 		}
- | 
- | 		figure {
- | 			background: green;
- | 			height: 100vh;
- | 		}
- | 	}
- | }
- | 
- | body {
- | 	> div {
- | 		background: green;
- | 		height: 100vh;
- | 	}
- | 
- | 	> figure {
- | 		background: green;
- | 		height: 100vh;
- | 	}
- | }
```
### Expected Output:
```diff
+ | @media (max-aspect-ratio:1.097 / 1) {
+ |     body {
+ |     	> div {
+ |     		background: green;
+ |     		height: 100vh;
+ |     	}
+ |     
+ |     	> figure {
+ |     		background: green;
+ |     		height: 100vh;
+ |     	}
+ |     }
+ | }
+ | 
+ | body {
+ | 	> div {
+ | 		background: green;
+ | 		height: 100vh;
+ | 	}
+ | 
+ | 	> figure {
+ | 		background: green;
+ | 		height: 100vh;
+ | 	}
+ | }
```

### Assumed/Predicted Issue:
The `combineSelectors` function in `scripts/converters.js` likely adds a space indiscriminately between parent and child selectors during denesting (e.g., `body` + `> div` becomes `body  > div`). Subsequently, the renesting logic in `findNestingRelationship` might be splitting these combined selectors at incorrect positions or failing to account for the combinator as part of the nested selector's identity, leading to the parent "stealing" the combinator.

### Potential Solution:
- Update `combineSelectors` to check if a child selector begins with a combinator before adding a separator space.
- Enhance `findNestingRelationship` to properly handle combinators so that they remain with the nested child selector (e.g., `& > div`) rather than being appended to the parent.

## Bug #2
### Description:
The tool incorrectly nests selectors that share a common string prefix, even if they are fundamentally different identifiers. For example, `ab + b` is nested under `a` as `&b + b`.

### Input:
```diff
+ | a {
+ |     color: red;
+ | }
+ | 
+ | ab + b {
+ |     color: red;
+ | }
```

### Output:
```diff
- | a {
- |     color: red;
- | 
- |     &b + b {
- |         color: red;
- |     }
- | }
```

### Expected Output:
```diff
+ | a {
+ |     color: red;
+ | }
+ | 
+ | ab + b {
+ |     color: red;
+ | }
```

### Assumed/Predicted Issue:
The `findNestingRelationship` function in `scripts/converters.js` uses a simple `startsWith` check on the selector strings. It doesn't verify if the match occurs at a token boundary, leading to false positives when one selector's name starts with another selector's name.

### Potential Solution:
Implement a more robust check in `findNestingRelationship` that ensures the character immediately following the match in the child selector is a valid separator (like a space, combinator, or pseudo-class/element colon) or that the match represents the entirety of a selector part.

## Bug #3 - Selector Lists
### Description:
The tool fails to nest rules that use selector lists (comma-separated selectors), even when they share a common parent structure.

### Input:
```diff
+ | .a, .b {
+ |     color: red;
+ | }
+ | .a .c, .b .c {
+ |     color: blue;
+ | }
```

### Output:
```diff
- | .a, .b {
- |     color: red;
- | }
- |
- | .a .c, .b .c {
- |     color: blue;
- | }
```

### Expected Output:
```diff
+ | .a, .b {
+ |     color: red;
+ |
+ |     .c {
+ |         color: blue;
+ |     }
+ | }
```

### Assumed/Predicted Issue:
The `findNestingRelationship` function explicitly returns `null` if either the parent or child selector contains more than one selector group. This is a hard-coded limitation that prevents any nesting for selector lists.

### Potential Solution:
Extend `findNestingRelationship` to handle selector lists. This could involve checking if all selectors in the child list can be nested under the parent list using a common pattern, or potentially using the `:is()` pseudo-class to group parents or children when they don't have a 1-to-1 matching relationship.

## Bug #4 - Performance Crash with Large CSS
### Description:
Processing large amounts of CSS (e.g., 4000+ lines or many rules) can cause the browser tab to freeze or crash. This is especially prevalent in Firefox.

### Symptoms:
- UI becomes unresponsive for several seconds when pasting or editing large CSS files.
- "Page unresponsive" dialogs or total tab crashes.

### Technical Analysis:
The primary bottleneck is the `renestCSS` function, which has a worst-case O(N^2) complexity where N is the number of rules. For each rule, it checks every subsequent rule for a nesting relationship. Inside this loop:
1.  Selectors were being stringified repeatedly (arrays joined and mapped) for comparison.
2.  Rules were being deep-cloned using `JSON.parse(JSON.stringify())` every time a nesting relationship was found, leading to massive memory allocations and CPU overhead, especially for rules with many declarations.

### Solution:
1.  **Selector Caching:** Cache the string representation of selectors within the `SelectorGroup` objects to avoid redundant string operations.
2.  **In-place Modification:** Since `renestCSS` operates on a fresh AST produced by `parseCSS`, it can safely modify the AST in-place instead of cloning rules during movement.
3.  **Eliminate redundant clones:** Removed the top-level AST clone and per-rule clones within the nesting loop.

## Bug #5 - Incorrect Multi-Selector Nesting
### Description:
The tool incorrectly nests a child rule under a parent rule with multiple selectors if the child matches only *one* of the parent's selectors. This results in the child rule being applied to all parent selectors in the output, which changes the CSS logic.

### Input:
```css
*,
*::before,
*::after {
	box-sizing: inherit;
}

.ui.ordered.steps .step > * {
  display: block;
  align-self: center;
}
```

### Output:
```css
*,
*::before,
*::after {
	box-sizing: inherit;

	.ui.ordered.steps .step > & {
		display: block;
		align-self: center;
	}
}
```

### Expected Output:
```css
*,
*::before,
*::after {
	box-sizing: inherit;
}

.ui.ordered.steps .step > * {
  display: block;
  align-self: center;
}
```

### Assumed/Predicted Issue:
The `findNestingRelationship` function iterates through child selectors and finds a match with *any* parent selector. If a match is found for a child selector with at least one parent selector, it proceeds with nesting, ignoring that other selectors in the parent list might not match.

### Potential Solution:
Modify `findNestingRelationship` to ensure that if a parent rule has multiple selectors, a child rule must either:
1. Match all parent selectors in the same way (to be represented by a single `&`).
2. Be a list of the same length as the parent list, where each child selector matches its corresponding parent selector.

## Bug #6 - Missed Nesting for Out-of-Order Rules
### Description:
The nesting engine fails to nest rules if the potential parent rule appears after the potential child rule in the source CSS. This leads to many missed nesting opportunities in large frameworks like Semantic UI where base classes and their variations are often defined in separate sections.

### Technical Analysis:
The `renestCSS` function utilized a single forward-only pass. For each rule at index `i`, it only looked at rules at index `j > i` as potential children. If a child rule appeared at index `j < i`, it would never be nested under its parent at index `i`.

### Solution:
Updated `renestCSS` to perform a two-pass approach. The first pass identifies nesting relationships between ALL rules (regardless of their relative order) and builds a `parentOf` map. The second pass reconstructs the AST based on this map, effectively moving rules into their parents.

## Bug #7 - Compound Selector Nesting failure for Multi-part Parents
### Description:
The tool fails to nest compound selectors (e.g., `.a.b`) under their parents if the parent selector consists of multiple parts (e.g., `.parent .a`).

### Input:
```css
.ui .buttons {
    display: block;
}
.ui .buttons.vertical {
    display: flex;
}
```

### Output:
```css
.ui .buttons {
	display: block;
}

.ui .buttons.vertical {
	display: flex;
}
```

### Expected Output:
```css
.ui .buttons {
	display: block;

	&.vertical {
		display: flex;
	}
}
```

### Technical Analysis:
The `findSingleGroupNestingRelationship` function only checked if the entire parent selector string was a prefix of the first part of the child selector. This failed whenever the parent had multiple parts (spaces or combinators) because child parts are tokenized.

### Solution:
Updated the compound nesting logic to verify that all parts of the parent except the last one match the beginning of the child exactly, and the last part of the parent is a prefix of the corresponding child part.

## Bug #8 - Idempotency Issue with Comments and Block Starts
### Description:
Subsequent passes of the nesting tool can add redundant newlines before comments that follow rules, or remove desired newlines at the start of blocks.

### Technical Analysis:
1. `parseCSS` forced `spacesAbove` to `1` for any node following a `Rule` or `AtRule`, regardless of the actual whitespace in the source.
2. `parseCSS` forced `spacesAbove` to `0` for the first node in any block, losing any extra newlines (empty lines) that might have been present.

### Solution:
Adjusted `parseCSS` to respect the detected `spacesAbove` more faithfully, using clamping instead of forcing specific values for block starts and nodes following rules.
