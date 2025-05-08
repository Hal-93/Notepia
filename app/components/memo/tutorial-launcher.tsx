import { useState } from "react";
import { Button } from "~/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import TutorialCarousel from "./tutorial";

export default function TutorialLauncher() {
  const [show, setShow] = useState(false);

  return (
    <>
      <div className="fixed bottom-[34px] right-[16px] z-[4] w-[48px] h-[48px]">
        <Button
          onClick={() => setShow(true)}
          className="rounded-full w-12 h-12 flex items-center justify-center shadow-md bg-cyan-600 hover:bg-cyan-800"
        >
          <FontAwesomeIcon icon={faInfoCircle} className="text-4xl" />
        </Button>
      </div>
      {show && <TutorialCarousel onClose={() => setShow(false)} />}
    </>
  );
}