import { useState } from "react";
import { Button } from "~/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import TutorialCarousel from "./tutorial";

export default function TutorialLauncher() {
  const [show, setShow] = useState(false);

  return (
    <>
      <div className="fixed bottom-4 right-4 z-[4] w-[60px] h-[60px] z-[4]">
        <Button
          onClick={() => setShow(true)}
          className="rounded-full w-12 h-12 flex items-center justify-center shadow-md bg-cyan-500 hover:bg-cyan-600"
        >
          <FontAwesomeIcon icon={faInfoCircle} className="text-4xl" />
        </Button>
      </div>
      {show && <TutorialCarousel onClose={() => setShow(false)} />}
    </>
  );
}