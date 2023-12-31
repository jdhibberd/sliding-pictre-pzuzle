/**
 * A single puzzle (for a specific player) within the competition.
 */
class Puzzle {
  static CARD_SIZE = 70;
  static CARD_PADDING = 1;
  static WIDTH = 4;
  static HEIGHT = 3;
  static GAP_VALUE = -1;
  static NUM_CARDS = Puzzle.WIDTH * Puzzle.HEIGHT;

  /**
   * Return the width, in pixels, of the picture.
   */
  static getWidth(): number {
    return (Puzzle.CARD_SIZE + Puzzle.CARD_PADDING) * Puzzle.WIDTH - 1;
  }

  /**
   * Return the height, in pixels, of the picture.
   */
  static getHeight(): number {
    return (Puzzle.CARD_SIZE + Puzzle.CARD_PADDING) * Puzzle.HEIGHT - 1;
  }

  /**
   * The array of cards that make up the puzzle.
   */
  #cards: number[];

  /**
   * The index of the missing card ("the gap") that allows cards to be
   * shifted.
   */
  #gapIndex: number;

  /**
   * HTML Canvas element (and context), used for drawing.
   */
  #canvas: HTMLCanvasElement;
  #ctx: CanvasRenderingContext2D;

  /**
   * Pixel data on the source picture that the puzzle is a scrambled version
   * of. The puzzle has a reference to both an active and inactive version of
   * the picture. The inactive version is used once the competition is
   * completed.
   */
  #pictureActiveData: ImageData;
  #pictureInactiveData: ImageData;

  /**
   * Callback for when puzzle is completed.
   */
  #onCompleted?: () => void;

  constructor(
    canvas: HTMLCanvasElement,
    pictureActiveData: ImageData,
    pictureInactiveData: ImageData,
  ) {
    this.#canvas = canvas;
    this.#canvas.width = Puzzle.getWidth();
    this.#canvas.height = Puzzle.getHeight();
    this.#pictureActiveData = pictureActiveData;
    this.#pictureInactiveData = pictureInactiveData;
    const ctx = this.#canvas.getContext("2d");
    if (ctx === null) throw "Failed to get canvas context.";
    this.#ctx = ctx;
    this.#cards = new Array(Puzzle.NUM_CARDS);
    for (let i = 0; i < Puzzle.NUM_CARDS; i++) {
      this.#cards[i] = i;
    }
    this.#gapIndex = Puzzle.NUM_CARDS - 1; // gap is always bottom-right card
    this.#cards[this.#gapIndex] = Puzzle.GAP_VALUE;
  }

  /**
   * Indicate that the puzzle has been shuffled and that the user can begin
   * attempting to solve it. This prevents the competition from being
   * prematurely "completed" if one of the puzzles happens to be "solved"
   * during the shuffle phase.
   */
  begin(onCompleted: () => void): void {
    this.#onCompleted = onCompleted;
    this.draw(true);
  }

  /**
   * Draw the current puzzle state to the canvas, erasing any existing
   * puzzle state.
   */
  draw(isActive: boolean): void {
    for (let i = 0; i < Puzzle.NUM_CARDS; i++) {
      this.#drawCard(i, isActive);
    }
  }

  /**
   * Draw a single card (within a puzzle) to the canvas. The card to be
   * drawn is at index position `i` in the puzzle.
   */
  #drawCard(i: number, isActive: boolean): void {
    const drawRowColumn = this.#getRowColumnFromIndex(i);
    const drawPoint = this.#getPointFromRowColumn(drawRowColumn);
    const sourceIndex = this.#cards[i];

    if (sourceIndex === Puzzle.GAP_VALUE) {
      this.#ctx.clearRect(
        drawPoint.x,
        drawPoint.y,
        Puzzle.CARD_SIZE,
        Puzzle.CARD_SIZE,
      );
    } else {
      const sourceRowColumn = this.#getRowColumnFromIndex(sourceIndex);
      const sourcePoint = this.#getPointFromRowColumn(sourceRowColumn);
      this.#ctx.putImageData(
        isActive ? this.#pictureActiveData : this.#pictureInactiveData,
        // Offset `drawPoint` coordinates by `sourcePoint` coordinates so
        // that the visible part of the source picture being draw is at
        // `drawPoint`, because `putImageData` will include buffer for non
        // visible parts of the source picture.
        drawPoint.x - sourcePoint.x,
        drawPoint.y - sourcePoint.y,
        sourcePoint.x,
        sourcePoint.y,
        Puzzle.CARD_SIZE,
        Puzzle.CARD_SIZE,
      );
    }
  }

  /**
   * Get the row and column position of a card within the puzzle given its
   * index.
   */
  #getRowColumnFromIndex(i: number): [number, number] {
    return [
      Math.floor(i / Puzzle.WIDTH), // row
      i % Puzzle.WIDTH, // column
    ];
  }

  /**
   * Return pixel coordinates of the top-left point of the card at the grid
   * position indicated by `row` and `column`.
   */
  #getPointFromRowColumn([row, column]: [number, number]): {
    x: number;
    y: number;
  } {
    return {
      x: column * (Puzzle.CARD_SIZE + Puzzle.CARD_PADDING),
      y: row * (Puzzle.CARD_SIZE + Puzzle.CARD_PADDING),
    };
  }

  /**
   * Shift the puzzle gap indicator to a new position and move the card
   * currently in that position to the old gap indicator position.
   *
   * We don't want to notify the competition object that the puzzle is solved
   * during the shuffle phase.
   */
  #swapGap(
    getTargetRowColumn: (
      row: number,
      column: number,
    ) => [number, number] | null,
  ): void {
    const [gapRow, gapColumn] = this.#getRowColumnFromIndex(this.#gapIndex);
    const targetRowColumn = getTargetRowColumn(gapRow, gapColumn);
    if (targetRowColumn === null) {
      return; // out-of-bounds shift
    }
    const [targetRow, targetColumn] = targetRowColumn;
    const targetIndex = targetRow * Puzzle.WIDTH + targetColumn;
    this.#cards[this.#gapIndex] = this.#cards[targetIndex];
    this.#cards[targetIndex] = Puzzle.GAP_VALUE;
    this.#drawCard(this.#gapIndex, true);
    this.#drawCard(targetIndex, true);
    this.#gapIndex = targetIndex;
    if (this.#onCompleted !== undefined && this.#isCompleted()) {
      this.#onCompleted();
    }
  }

  /**
   * Shift the card immediately above the gap indicator down.
   */
  shiftDown(): void {
    this.#swapGap((row, column) => (row > 0 ? [row - 1, column] : null));
  }

  /**
   * Shift the card immediately below the gap indicator up.
   */
  shiftUp(): void {
    this.#swapGap((row, column) =>
      row < Puzzle.HEIGHT - 1 ? [row + 1, column] : null,
    );
  }

  /**
   * Shift the card immediately left the gap indicator up.
   */
  shiftRight(): void {
    this.#swapGap((row, column) => (column > 0 ? [row, column - 1] : null));
  }

  /**
   * Shift the card immediately right the gap indicator up.
   */
  shiftLeft(): void {
    this.#swapGap((row, column) =>
      column < Puzzle.WIDTH - 1 ? [row, column + 1] : null,
    );
  }

  /**
   * Return whether the puzzle has been shifted into the original sequence, to
   * match the picture.
   */
  #isCompleted(): boolean {
    // we don't need to check the last card which, if all the
    // others are correctly sorted, will be the gap value
    for (let i = 0; i < Puzzle.NUM_CARDS - 1; i++) {
      if (this.#cards[i] !== i) {
        return false;
      }
    }
    return true;
  }
}

/**
 * Shuffles a list of puzzles randomly, but in the same way to create an equal
 * challenge for all players.
 */
class Shuffler {
  static SHIFTS_PER_SHUFFLE = 100;

  /**
   * An array of the two puzzle objects that are part of the competition.
   */
  #puzzles: Puzzle[];

  constructor(...puzzles: Puzzle[]) {
    this.#puzzles = puzzles;
  }

  shuffle(): void {
    const shifts = [
      Puzzle.prototype.shiftDown,
      Puzzle.prototype.shiftUp,
      Puzzle.prototype.shiftLeft,
      Puzzle.prototype.shiftRight,
    ];
    for (let i = 0; i < Shuffler.SHIFTS_PER_SHUFFLE; i++) {
      const randomShift = shifts[Math.floor(Math.random() * shifts.length)];
      this.#puzzles.map((puzzle) => randomShift.call(puzzle));
    }
  }
}

class Competition {
  /**
   * Draw the source picture that needs to be solved as part of the puzzle, in
   * either its active or inactive form. Returns image data for the picture
   * which is then referenced by each puzzle.
   */
  static drawPicture(canvas: HTMLCanvasElement, isActive: boolean): ImageData {
    const w = (canvas.width = Puzzle.getWidth());
    const h = (canvas.height = Puzzle.getHeight());
    const ctx = canvas.getContext("2d")!;
    if (ctx === null) throw "Failed to get canvas context.";
    if (!isActive) {
      ctx.globalAlpha = 0.2;
    }
    ctx.fillStyle = "pink";
    ctx.fillRect(0, 0, w, h);
    let gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, "red");
    gradient.addColorStop(1, "purple");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, h / 2.5, 0, 2 * Math.PI);
    ctx.fill();
    return ctx.getImageData(0, 0, w, h);
  }

  /**
   * Whether either of the puzzles has been completed, and the competition is
   * over.
   */
  #isCompleted = false;

  /**
   * The two puzzles that make up the competition.
   */
  #puzzle1: Puzzle;
  #puzzle2: Puzzle;

  constructor(
    pictureActiveCanvas: HTMLCanvasElement,
    pictureInactiveCanvas: HTMLCanvasElement,
    puzzle1Canvas: HTMLCanvasElement,
    puzzle2Canvas: HTMLCanvasElement,
  ) {
    const pictureActiveData = Competition.drawPicture(
      pictureActiveCanvas,
      true,
    );
    const pictureInactiveData = Competition.drawPicture(
      pictureInactiveCanvas,
      false,
    );
    this.#puzzle1 = new Puzzle(
      puzzle1Canvas,
      pictureActiveData,
      pictureInactiveData,
    );
    this.#puzzle2 = new Puzzle(
      puzzle2Canvas,
      pictureActiveData,
      pictureInactiveData,
    );
    new Shuffler(this.#puzzle1, this.#puzzle2).shuffle();
    this.#puzzle1.begin(() => {
      this.onPuzzleCompleted(this.#puzzle2);
    });
    this.#puzzle2.begin(() => {
      this.onPuzzleCompleted(this.#puzzle1);
    });
  }

  /**
   * Stop the competition when one of the puzzles is solved.
   */
  onPuzzleCompleted(incompletedPuzzle: Puzzle): void {
    this.#isCompleted = true;
    incompletedPuzzle.draw(false);
  }

  /**
   * Shift the cards of each puzzle in response to the user's keyboard input.
   */
  onKeyDown(event: KeyboardEvent): void {
    if (this.#isCompleted === true) {
      return;
    }
    switch (event.key) {
      case "w":
        this.#puzzle1.shiftUp();
        break;
      case "d":
        this.#puzzle1.shiftRight();
        break;
      case "s":
        this.#puzzle1.shiftDown();
        break;
      case "a":
        this.#puzzle1.shiftLeft();
        break;
      case "i":
        this.#puzzle2.shiftUp();
        break;
      case "l":
        this.#puzzle2.shiftRight();
        break;
      case "k":
        this.#puzzle2.shiftDown();
        break;
      case "j":
        this.#puzzle2.shiftLeft();
        break;
    }
  }
}

window.addEventListener("DOMContentLoaded", function () {
  const competition = new Competition(
    document.querySelector<HTMLCanvasElement>("#pictureActive")!,
    document.querySelector<HTMLCanvasElement>("#pictureInactive")!,
    document.querySelector<HTMLCanvasElement>("#puzzle1")!,
    document.querySelector<HTMLCanvasElement>("#puzzle2")!,
  );
  window.addEventListener("keydown", function (event) {
    competition.onKeyDown(event);
  });
});
