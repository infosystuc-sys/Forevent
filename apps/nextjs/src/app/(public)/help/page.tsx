import { HelpCircle, Phone } from "lucide-react";
import Link from "next/link";
import { Button } from "~/app/_components/ui/button";
import { Input } from "~/app/_components/ui/input";

export default function Helpcenter() {

    return (
        <>
            <div className="relative w-screen h-full ">
                <div className="flex flex-col w-screen">

                    <h1 className={`font-sans text-2xl font-extrabold text-center px-5`}>
                        EN QUÉ PODEMOS AYUDARTE?
                    </h1>
                    <div className="flex w-full md:w-1/2 md:self-center items-center mt-16 hover:bg-transparent shadow-2xl transition duration-400 ease-in-out over:shadow-custom space-x-1 px-5">
                        <Input type="email" placeholder="Haz tu pregunta aquí..." className={`bg-white shadow-2xl transition duration-400 ease-in-out hover:shadow-custom  text-black font-sans font-extrabold`} />
                        <Button variant={'default'} className={`text-white shadow-2xl transition duration-400 ease-in-out hover:text-black hover:shadow-custom  font-sans font-bold bg-black`}>BUSCAR</Button>
                    </div>

                    <div className=" flex flex-col md:flex-row justify-center items-center mt-20 py-10 bg-neutral-100 ">
                        <div className="max-w-7xl flex justify-center items-center flex-col hover:bg-white hover:rounded-xl py-5 text-left">
                            <div className="rounded-full h-16 w-16 flex items-center justify-center bg-white hover:bg-neutral-100 p-5 text-neutral-800 p-5">
                                <HelpCircle />
                            </div>
                            <button className={`font-sans font-bold px-5  text-2xl text-left bg-transparent h-20  text-neutral-800`}>
                                Preguntas frecuentes
                            </button>
                            <p className={`font-sans font-light text-neutral-400 text-left`}>Encuentra todos los articulos.</p>
                        </div>


                        {/*
                        <div className="max-w-full flex justify-center items-center flex-col hover:bg-white hover:rounded-xl py-5  ">
                            <div className="rounded-full h-16 w-16 flex items-center justify-center bg-white p-5 text-neutral-800">
                                <Ticket />
                            </div>
                            <button className={` font-sans font-bold px-5  text-2xl text-center h-20 text-neutral-800`}>
                                Mis entradas
                            </button>
                            <p className={` font-sans font-light text-neutral-400 text-center`}>Ver tus articulos.</p>
                        </div>

                        <Separator className="bg-neutral-300 h-36" orientation="vertical" />
                     */}

                        <div className="max-w-7xl flex justify-center items-center flex-col hover:bg-white hover:rounded-xl py-5">
                            <div className="rounded-full h-16 w-16 flex items-center justify-center bg-white hover:bg-neutral-100 p-5 text-neutral-800 p-5">
                                <Phone />
                            </div>
                            <button className={` font-sans font-bold px-5  text-2xl text-center bg-transparent h-20 text-neutral-800`}>
                                Ponete en contacto
                            </button>
                            <p className={` font-sans font-light text-neutral-400 text-center`}>Contacta a nuestro equipo.</p>
                        </div>
                    </div>


                    <div className="">
                        <div className="flex flex-col md:grid md:grid-cols-2 py-10 px-5 md:px-24 bg-white text-black gap-2">
                            <Link href={"/questions"} className="w-full">
                                <Button variant={'questions'} className={` font-sans font-bold px-5  text-xl  h-20  text-neutral-800 w-full`}>
                                    Lorena
                                </Button>
                            </Link>
                            <Link href={"/questions"} className="w-full">
                                <Button variant={'questions'} className={` font-sans font-bold px-5  text-xl  h-20  text-neutral-800 w-full`}>
                                    Lorena
                                </Button>
                            </Link>
                            <Link href={"/questions"} className="w-full">
                                <Button variant={'questions'} className={` font-sans font-bold px-5  text-xl  h-20  text-neutral-800 w-full`}>
                                    Lorena
                                </Button>
                            </Link>
                            <Link href={"/questions"} className="w-full">
                                <Button variant={'questions'} className={` font-sans font-bold px-5  text-xl  h-20  text-neutral-800 w-full`}>
                                    Lorena
                                </Button>
                            </Link>
                            <Link href={"/questions"} className="w-full">
                                <Button variant={'questions'} className={` font-sans font-bold px-5  text-xl  h-20  text-neutral-800 w-full`}>
                                    Lorena
                                </Button>
                            </Link>
                            <Link href={"/questions"} className="w-full">
                                <Button variant={'questions'} className={` font-sans font-bold px-5  text-xl  h-20  text-neutral-800 w-full`}>
                                    Lorena
                                </Button>
                            </Link>

                        </div>


                    </div>

                    <div className="relative w-full h-full ">
                        <div className="flex flex-col items-center justify-center  py-24 bg-opacity-75 bg-gradient-to-br from-amber-500 via-pink-500 to-violet-500  gap-10 ">
                            <h1 className={` font-sans text-3xl font-bold text-center`}>
                                ¿Necesitas más ayuda?
                            </h1>
                            <h1 className={` font-sans text-lg font-light text-center`}>Contacta con nuestro equipo de soporte</h1>
                            <Button variant={'help'} className={` `}>
                                Ponete en contacto
                            </Button>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );

}




