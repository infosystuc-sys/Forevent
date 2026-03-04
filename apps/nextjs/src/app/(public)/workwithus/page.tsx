import Image from "next/image";
import { Button } from "~/app/_components/ui/button";
import mockup from '../../../../public/Mockup.png';
import mockup3 from '../../../../public/mockup-3.png';
import './page.css';

export default function Workwithus() {

    return (
        <>
            <section className="workwithus-bg">
                <div className="bg-black/50 backdrop-blur-sm w-full h-full">
                    <div className="overlay w-full h-full">
                        <div className="flex flex-col h-screen justify-center items-center gap-y-10">
                            <h1 className={`text-4xl md:text-7xl font-extrabold text-center uppercase`}>
                                Contratá Forevent
                            </h1>
                            <p className={`text-xl font-light text-center max-w-prose`}>
                                Brindamos una experiencia de ususario dinámica al facilitar el conocimiento de los distintos puntos de entretenimiento que se encuentran a su alrededor y a su vez proporcionarle acceso rápido a los mismos
                            </p>
                            <Button variant={'default'} size={"lg"} className={`text-2xl p-6 px-10 hover:bg-transparent bg-primary rounded-full shadow-2xl text-white transition duration-300 ease-in-out border border-primary w-[full]`}>
                                Contáctanos
                            </Button>
                        </div>
                    </div>
                </div>
            </section>
            <section className="container grid grid-cols-1 lg:grid-cols-2 py-3">
                <div className="flex justify-center items-center">
                    <Image src={mockup} alt="forenvent app" className="w-[250px]" />
                </div>
                <div className="flex justify-center items-center flex-col text-center">
                    <h3 className="text-3xl uppercase font-extrabold my-3">
                        Para móviles
                    </h3>
                    <p className="text-lg font-light">
                        Nuestra aplicación muestra todos los eventos disponibles en una zona, ¡Incluyendo tu evento!. Además, se pueden ver los artistas disponibles en el evento, chatear con nuevas personas y comprar consumisiones; todo desde la app de Forevent
                    </p>
                </div>
            </section>
            <section className="container grid grid-cols-1 lg:grid-cols-2 py-6">
                <div className="flex justify-center items-center flex-col text-center">
                    <h3 className="text-3xl uppercase font-extrabold my-3">
                        Para móviles
                    </h3>
                    <p className="text-lg font-light">
                        Nuestra aplicación muestra todos los eventos disponibles en una zona, ¡Incluyendo tu evento!. Además, se pueden ver los artistas disponibles en el evento, chatear con nuevas personas y comprar consumisiones; todo desde la app de Forevent
                    </p>
                </div>
                <div className="flex justify-center items-center">
                    <Image src={mockup3} alt="forenvent app" className="w-[650px]" />
                </div>
            </section>
        </>

    );
}