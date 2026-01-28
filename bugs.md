# All known bugs
## Bug #1
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
## Bug #2 - Issue #2 ()
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
## Bug #3
### Input:
```diff

```
### Output:
```diff
```
### Expected Output:
```diff
```
