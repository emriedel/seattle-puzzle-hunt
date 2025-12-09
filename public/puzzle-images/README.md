# Puzzle Images

This directory contains images used for image-based puzzles like the slide puzzle.

## Adding Images

1. Place your square images in this directory
2. Reference them in hunt JSON files using the path format: `/puzzle-images/your-image.jpg`
3. Recommended image size: 300x300px or larger
4. Supported formats: JPG, PNG, WebP

## Example

For a slide puzzle, add an entry like this to your hunt JSON:

```json
{
  "type": "slide_puzzle",
  "prompt": "Solve the slide puzzle to reveal the location",
  "image": "/puzzle-images/your-image.jpg",
  "answer": "SOLVED",
  "answer_length": 6
}
```

## Test Image

To test the slide puzzle, you can:
1. Download any square image and save it as `test-puzzle.jpg` in this directory
2. Or use an online image URL temporarily for testing
3. Visit `/test/puzzles` to test the slide puzzle component
