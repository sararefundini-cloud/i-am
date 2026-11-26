(() => {
  "use strict";

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function action(label, select) {
    const button = element("button", "enc-action", label);
    button.type = "button";
    button.addEventListener("click", select);
    return button;
  }

  function passage(words, ref) {
    const quote = element("blockquote", "enc-passage");
    quote.append(element("p", "", "“" + words + "”"), element("cite", "", ref + " · KJV"));
    return quote;
  }

  // The diagrams repeat the information in the prose and need no separate tab stops.
  function study(name, state, pieces) {
    const panel = element("div", "enc-study enc-" + name);
    panel.dataset.state = state;
    panel.setAttribute("aria-hidden", "true");
    pieces.forEach(([kind, label]) => panel.append(element("span", "enc-" + kind, label)));
    return panel;
  }

  function corner(state) {
    return study("corner", state, [["course"], ["cross-course"], ["block"]]);
  }

  function lamp(state) {
    return study("lamp", state, [["lamplight"], ["stone-slip", "Refused"], ["bread-slip", "Gathered"]]);
  }

  function route(state) {
    return study("route", state, [["thread"], ["boat", "The boat"], ["table", "The table"], ["boat-again", "The boat"]]);
  }

  function mason(room) {
    function turn(edge) {
      room.find("Psalm 118:22", "Stone", "The rough face the builders passed over is still there when the stone takes its place.");
      const broad = edge === "broad";
      room.draw({
        title: broad ? "A hand underneath" : "The rough edge",
        art: corner(broad ? "broad" : "rough"),
        body: broad
          ? "Your palm takes the weight. The underside is broad enough to rest on. Turn it upright again and the rough end comes back into view."
          : "A ridge catches your thumb. You turn the block far enough to see a broad face under it. The ridge stays just as it was.",
        quote: passage("The stone which the builders refused is become the head stone of the corner.", "Psalm 118:22"),
        choices: [
          action("Set it at the corner", fit),
          action(broad ? "Feel the rough edge" : "Look underneath", () => turn(broad ? "rough" : "broad"))
        ]
      });
    }

    function fit() {
      room.find("1 Peter 2:4", "Stone", "Peter calls Jesus a living stone, refused by people and precious to God.");
      room.draw({
        title: "Where the walls meet",
        art: corner("set"),
        body: "You ease the stone into the gap. Run a finger along either wall and it comes back to the rough edge that caught your hand. In the psalm the builders pass it by. Peter returns to that same stone to speak of Jesus.",
        quote: passage("To whom coming, as unto a living stone, disallowed indeed of men, but chosen of God, and precious,", "1 Peter 2:4"),
        reflection: "What did the builders see when they passed it over? What do you see from the corner?",
        choices: [room.finish()]
      });
    }

    room.draw({
      title: "The stone in his hands",
      art: corner("loose"),
      body: "At the end of Stoned, the Stone Maker holds the block the builders passed over. Here it lies within reach. Two courses of stone stop short of a corner.",
      choices: [action("Turn it by the rough edge", () => turn("rough")), action("Lift the broad face", () => turn("broad"))]
    });
  }

  function illuminence(room) {
    const seen = new Set();
    function light(side) {
      if (side) {
        seen.add(side);
        if (side === "bread") room.find("John 6:12", "Bread", "After everyone has eaten, Jesus still asks for the pieces to be gathered.");
        else room.find("Psalm 118:22", "Stone", "A stone left aside by the builders becomes the head of the corner.");
      }
      const choices = [];
      if (side !== "stone") choices.push(action("Move the lamp toward the stone", () => light("stone")));
      if (side !== "bread") choices.push(action("Move the lamp toward the bread", () => light("bread")));
      if (seen.size === 2) choices.unshift(action("Lift the lamp over both", together));
      const scenes = {
        center: {
          title: "At the edge of the light",
          body: "A stone and a broken piece of barley bread lie just outside the pool of lamplight. What was left here?"
        },
        stone: {
          title: "What was left",
          body: "The light falls along the block’s uneven edge. Someone looked at this stone and walked on. Follow it to the end of the psalm and two walls meet there.",
          quote: passage("The stone which the builders refused is become the head stone of the corner.", "Psalm 118:22")
        },
        bread: {
          title: "What was left over",
          body: "The light catches the torn edge of the loaf. Everyone on the grass has eaten. There is still bread to pick up.",
          quote: passage("Gather up the fragments that remain, that nothing be lost.", "John 6:12")
        }
      };
      room.draw({ ...scenes[side || "center"], art: lamp(side || "center"), choices });
    }

    function together() {
      room.draw({
        title: "What remains",
        art: lamp("both"),
        body: "From here you can see both edges. One was left when the builders walked away. One was left because Jesus had fed everyone. In one story God gives the stone a place. In the other, Jesus sends people back for the fragments.",
        reflection: "When you first saw the piece of bread, could you tell whether anyone had eaten?",
        choices: [room.finish(), action("Lower the lamp again", () => light(null))]
      });
    }
    light(null);
  }

  function path(room) {
    function count() {
      room.find("Mark 8:19", "Bread", "The disciples remember the twelve baskets when Jesus asks them on the boat.");
      room.draw({
        title: "Twelve baskets",
        art: route("count"),
        body: "Try the count again. Five loaves. Five thousand people. Twelve baskets came back full. The disciples can give Jesus that last number. His question on the boat is still open.",
        quote: passage("How is it that ye do not understand?", "Mark 8:21"),
        choices: [action("Follow the bread to the mother's story", mother)]
      });
    }

    function mother() {
      room.find("Matthew 15:25–27", "Bread", "The mother takes up the image of the children's bread and notices what falls from the table.");
      room.draw({
        title: "Under the table",
        art: route("table"),
        body: "In Matthew, a mother asks Jesus to help her daughter. He speaks of the children’s bread. She takes up the very same image and follows it below the table, where the crumbs fall.",
        quote: passage("yet the dogs eat of the crumbs which fall from their masters’ table.", "Matthew 15:27"),
        choices: [action("Follow her request to her daughter", daughter)]
      });
    }

    function daughter() {
      room.find("Matthew 15:28", "Bread", "Jesus answers the mother, and her daughter is healed that very hour.");
      room.draw({
        title: "For her daughter",
        art: route("daughter"),
        body: "A crumb was the mother’s answer to the picture of bread. What she asked Jesus for was mercy for her daughter. Matthew takes us from the table in her words to the child herself.",
        quote: passage("her daughter was made whole from that very hour.", "Matthew 15:28"),
        choices: [action("Trace the thread back to the boat", boatAgain)]
      });
    }

    function boatAgain() {
      room.find("Mark 8:21", "Bread", "The mother's trust in what falls from the table brings the question on the boat back into focus.");
      room.draw({
        title: "One loaf, again",
        art: route("return"),
        body: "Pick up the thread where you left it. The disciples have one loaf and remember twelve baskets. The mother asked for a crumb because she trusted the one who gives the bread. Now read his question again.",
        quote: passage("How is it that ye do not understand?", "Mark 8:21"),
        reflection: "Suppose you were in the boat. What would you want to ask Jesus about that one loaf?",
        choices: [room.finish(), action("Go back to the mother’s words", mother)]
      });
    }

    room.draw({
      title: "One loaf on board",
      art: route("boat"),
      body: "In Mark, the disciples count one loaf in the boat and worry about bread. Jesus asks them to remember the five loaves and what was left. Hold your place at his question.",
      quote: passage("How is it that ye do not understand?", "Mark 8:21"),
      choices: [action("Count back to the baskets", count), action("Trace the thread to the mother", mother)]
    });
  }

  const stories = new Map([["mason", mason], ["illuminence", illuminence], ["path", path]]);

  function open(id, { root, onFind, onComplete }) {
    const story = stories.get(id);
    if (!story) throw new Error("Unknown encounter: " + id);
    const section = element("section", "iam-encounter");
    const seen = new Set();
    let complete = false;
    let painted = false;
    root.replaceChildren(section);
    story({
      draw({ title, art, body, quote, reflection, choices }) {
        const heading = element("h2", "enc-heading", title);
        heading.tabIndex = -1;
        const buttons = element("div", "enc-actions");
        buttons.append(...choices);
        const content = [heading, art, element("p", "enc-body", body)];
        if (quote) content.push(quote);
        if (reflection) content.push(element("p", "enc-reflection", reflection));
        content.push(buttons);
        section.replaceChildren(...content);
        if (painted) heading.focus();
        painted = true;
      },
      find(ref, motif, note) {
        if (seen.has(ref)) return;
        seen.add(ref);
        onFind?.({ ref, motif, note });
      },
      finish() {
        return action("Finish this encounter", () => {
          if (complete) return;
          complete = true;
          onComplete?.();
        });
      }
    });
  }

  window.IAMEncounters = Object.freeze({ open });
})();
