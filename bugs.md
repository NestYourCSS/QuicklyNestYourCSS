# All known bugs

<!--
## Bug #0

### Description:
...

### Input:
```css
...
```

### Output:
```diff
- | ...
```

### Expected Output:
```diff
+ | ...
```

### Assumed/Predicted Issue:
...

### Potential Solution:
...
-->

## Bug #1

### Description:
The CSS nesting converter fails to group selectors that share a common ancestor if the rules are separated by one or more empty lines. The expected behavior is to merge the common ancestor (`.a`) regardless of the whitespace between the child rules.

### Input:
```css
.a .b { color: red; }

.a .c { color: red; }
```

### Output:
```diff
- | .a .b { color: red; }
- | 
- | .a .c { color: red; }
```

### Expected Output:
```diff
+ | .a {
+ | 	.b {
+ | 		color: red;
+ | 	}
+ | 
+ | 	.c {
+ | 		color: red;
+ | 	}
+ | }
```

### Assumed/Predicted Issue:
The logic in `scripts/nesting.js` likely iterates through the CSS rules sequentially and compares the current rule's selector with the *immediately preceding* rule to check for common prefixes. The presence of an empty line (newline character) breaks this chain of adjacency. The parser treats the empty line as a delimiter that resets the "current parent" context, causing the second rule to be treated as a new, standalone entry rather than a sibling of the previous rule.

### Potential Solution:
1.  **Skip Whitespace:** Modify the iteration logic in `scripts/nesting.js` to look back at the last *valid* rule, skipping over empty lines or whitespace-only strings, when determining if the current rule shares a parent with the previous one.


## Bug #2

### Description:
...

### Input:
```css
.a, .b {
    color: red;
}
.a .c, .b .c, .d {
    color: blue;
}
```

### Output:
```diff
- | .a, .b {
- | 	color: red;
- | }
- | 
- | .a .c, .b .c, .d {
- | 	color: blue;
- | }
```

### Expected Output:
```diff
+ | .a, .b {
+ | 	color: red;
+ | 
+ | 	.c {
+ | 		color: blue;
+ | 	}
+ | }
+ | 
+ | .d {
+ | 	color: blue;
+ | }
```

### Assumed/Predicted Issue:
...

### Potential Solution:
...