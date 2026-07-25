import { BookHeart, HandCoins, Leaf } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { useHead } from "../hooks";
import styles from "./AboutPage.module.css";

const VALUES = [
  {
    icon: BookHeart,
    title: "Hand-picked, not algorithmic",
    text: "Every title on our shelves was chosen by a person who read it, not a recommendation engine chasing engagement.",
  },
  {
    icon: HandCoins,
    title: "Honest prices",
    text: "One price, no surge pricing on the book everyone's talking about this week.",
  },
  {
    icon: Leaf,
    title: "Built to last",
    text: "No dark patterns, no guilt trips about your \"reading streak.\" Just books.",
  },
];

export function AboutPage() {
  const navigate = useNavigate();

  useHead({
    title: "About — Bookish.",
    description: "Bookish is an independent online bookstore for people who read the acknowledgements.",
  });

  return (
    <div className={styles.page}>
      <div className={styles.intro}>
        <h1 className={styles.title}>An independent bookstore, still run by people.</h1>
        <p className={styles.lede}>
          Bookish started as a shared spreadsheet of favorite books between two
          former booksellers who missed handselling. It's grown into a small
          online shelf across six genres — still picked one book at a time.
        </p>
      </div>

      <div className={styles.values}>
        {VALUES.map(({ icon: Icon, title, text }) => (
          <div className={styles.value} key={title}>
            <Icon aria-hidden="true" size={22} className={styles.valueIcon} />
            <p className={styles.valueTitle}>{title}</p>
            <p className={styles.valueText}>{text}</p>
          </div>
        ))}
      </div>

      <div className={styles.cta}>
        <h2 className={styles.ctaTitle}>Come browse the shelves.</h2>
        <Button onClick={() => navigate({ pathname: "/", hash: "catalog" })}>
          Browse the shelves
        </Button>
      </div>
    </div>
  );
}
