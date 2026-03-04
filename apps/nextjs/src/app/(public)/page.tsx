import Image from 'next/image';
import Link from 'next/link';
import { ReactNode } from 'react';
import { Button, buttonVariants } from '~/app/_components/ui/button';
import mockup from '../../../public/Mockup.png';
import mockup2 from '../../../public/mockup-1.png';
import mockup3 from '../../../public/mockup-3.png';
import party2 from '../../../public/party-2.jpg';
import party3 from '../../../public/party-3.jpg';
import party4 from '../../../public/party-4.jpg';
import party from '../../../public/party.jpg';
import './page.css';
import Disco from '../_components/svg/disco';
import Dj from '../_components/svg/dj';
import Ticket from '../_components/svg/ticket';
import Chat from '../_components/svg/chat';
import Cocktail from '../_components/svg/cocktail';
import Tablet from '../_components/svg/tablet';
import Trending from '../_components/svg/trending';
import ThisWeek from '../_components/svg/thisweek';
import Private from '../_components/svg/private-event';
import Today from '../_components/svg/today';


const InfoCard = ({ text, svg }: { text: string, svg: ReactNode }) => {
  return (
    <div className="flex flex-col scroll-animation gap-5 mb-10">
      <div className="flex items-center justify-center m-auto h-32 w-32 md:h-26 md:w-26">
        {svg}
      </div>
      <p className={`font-sans font-light text-2xl text-center my-auto`}>
        {text}
      </p>
    </div>
  )
}

const Category = ({ text, svg }: { text: string, svg: ReactNode }) => {
  return (
    <div className="flex flex-col w-48 h-48 space-y-2 mx-auto justify-center items-center scroll-animation">
      {svg}
      <p className={`font-sans font-light text-xl lg:text-2xl md:text-2xl text-center `}>
        {text}
      </p>
    </div>
  )
}

export default async function Page() {
  return (
    <>
      <div className="flex flex-col">

        <div className="container min-h-[85vh] flex justify-center items-center mt-32">
          <div className="flex justify-center items-center h-full w-full grow-0 flex-col">
            <h1 className={`font-sans lg:text-7xl text-4xl uppercase mx-5  text-center font-extrabold justify-center items-center `}>
              Unete a Forevent ahora
            </h1>
            <p className={`text-center font-sans text-md mx-5 mt-5 font-light md:text-2xl`}>
              Somos la App que innovará tu experiencia en todos los eventos disponibles a tu alrededor.
            </p>
            <div className="mb-10 mt-5 mx-5 justify-center md:mb-5 ">
              <Link href="#download" className={buttonVariants({ variant: 'default', size: 'lg', className: `text-2xl font-bold p-6 px-10 hover:bg-transparent bg-primary rounded-full shadow-2xl text-white transition duration-300 ease-in-out border border-primary w-[full]` })}>
                Descarga la App
              </Link>
            </div>
          </div>
          <div className="">
            <Image
              src="/intro.png"
              alt="Forevent logo"
              width={1000}
              height={1000}
              quality={100}
            />
          </div>
        </div>
        <div className='flex flex-1 items-center justify-center'>
          <div className="flex flex-1 mt-10 min-h-[60vh] justify-center items-center md:max-w-6xl">
            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 content-start items-start justify-start gap-10">
              <InfoCard text="¡Tendrás acceso a una gran varidedad de eventos, discotecas, y bar pubs!" svg={
                <Disco />
              } />

              <InfoCard text="Podrás visualizar los shows y artistas que participen de cada evento" svg={
                <Dj />
              } />

              <InfoCard text="De una manera fácil y rápida podrás comprar tus entrada y solicitar reservaciones online" svg={
                <Ticket />
              } />

              <InfoCard text="Tendras acceso a nuestra red social cerrada exclusiva de cada evento y muchas funciones más!" svg={
                <Chat />
              } />

              <InfoCard text="Forevent contará con promociones exclusivas y te perimtirá adquirir y divisar los productos del evento" svg={
                <Cocktail />
              } />

              <InfoCard text="Contamos con un sistema de gestion multifuncional para el evento" svg={
                <Tablet />
              } />
            </div>
          </div>
        </div>
        <div className="container min-h-[90vh] flex flex-col my-40 justify-center items-center md:max-w-6xl">
          <div className="items-center">
            <h1 className={`font-sans text-4xl md:text-7xl font-extrabold text-center mb-10 uppercase tracking-wide`}>
              Encuentra el evento que mas te guste
            </h1>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-24 w-full items-start justify-start">
            <Category text='Tendencias' svg={
              <Trending className='tendencias' />
            } />
            {/* <Category text='Bares' svg={
              <Bar className='bar' />
            } /> */}
            {/* <Category text='Cultural' svg={
              <Cultural className='cultural' />
            } /> */}
            <Category text='Esta semana' svg={
              <ThisWeek className='estasemana' />
            } />
            <Category text='Fiestas Privadas' svg={
              <Private className='fiestasprivadas' />
            } />
            <Category text='Hoy' svg={
              <Today className='hoy' />
            } />
          </div>
        </div>

        <section className="container grid grid-cols-1 lg:grid-cols-2 place-items-center my-20 lg:gap-6 md:max-w-6xl">
          <div className="flex flex-col gap-2">
            <div className="ms-7 flex gap-2">
              <div className="max-w-[200px] max-h-[225px] scroll-animation transition-all duration-300 hover:scale-110">
                <Image width={150} height={175} src={party} alt="Fiesta" className="rounded-md object-cover w-full h-full" />
              </div>
              <div className="max-w-[200px] max-h-[225px] scroll-animation transition-all duration-300 hover:scale-110">
                <Image width={150} height={175} src={party2} alt="Fiesta" className="rounded-md object-cover w-full h-full" />
              </div>
            </div>
            <div className="me-7 flex gap-2">
              <div className="max-w-[200px] max-h-[225px] scroll-animation transition-all duration-300 hover:scale-110">
                <Image width={150} height={175} src={party3} alt="Fiesta" className="rounded-md object-cover w-full h-full" />
              </div>
              <div className="max-w-[200px] max-h-[225px] scroll-animation transition-all duration-300 hover:scale-110">
                <Image width={150} height={175} src={party4} alt="Fiesta" className="rounded-md object-cover w-full h-full" />
              </div>
            </div>
          </div>
          <div className="mt-10 lg:mt-0 text-center lg:text-start scroll-animation">
            <h3 className="text-4xl tracking-wide font-extrabold mb-2 uppercase">Un feed con todos los eventos trending del momento</h3>
            <p className="text-lg">La aplicación también posee una red social integrada
              en la misma plataforma brindando una experiencia completa.</p>
            <Button size="lg" variant="default" className="mt-5" asChild>
              <Link href="#download">Bajate la app</Link>
            </Button>
          </div>
        </section>
        {/* <div className="md:flex ">
          <div className="flex flex-col md:flex-row mx-5 md:gap-10 md:md:py-20 md:items-center md:justify-center ">
            <div >
              <Image
                src="/fiesta-3.jpg"
                alt="Forevent logo"
                width={350}
                height={100}
                className="mr-2 rounded-sm md:w-[100%] md:h-[100%]"

              />
            </div>
            <div className=" COLUMNA flex flex-col gap-2  mb-2.5 relative md:w-3/12 md:self-end">
              <h1 className={`font-sans text-2xl font-extrabold`}>
                UN FEED CON TODOS LOS EVENTOS TRENDING DEL MOMENTO
              </h1>
              <p className={`font-sans text-lg font-light`}>
                La aplicación también posee una red social integrada
                en la misma plataforma brindando una experiencia completa.

              </p>
              <div className="">
                <Button variant={'ghost'} className={`hover:bg-transparent rounded-full shadow-2xl transition duration-400 ease-in-out hover:shadow-custom border border-fuchsia-600`}>
                  BAJATE LA APP!
                </Button>
              </div>
            </div>
          </div>
        </div> */}

        <div className="container min-h-[80vh] flex flex-col justify-center items-center scroll-animation sm:max-w-6xl md:max-w-7xl" >
          <p className={`font-sans text-5xl md:text-8xl font-extrabold tracking-wide uppercase`}>
            La app es fabulosa, fácil de usar y te muestra los eventos que <span className="text-primary">te pueden interesar.</span>
          </p>
          <small className={` md:col-start-2 md:col-span-4 mt-5 font-sans text-sm md:text-2xl font-light text-left px-5 self-start mb-10 md:mb-24 md:mx-5`}>
            Leo Messi, Miami.
          </small>
        </div>

        <div className="container sm:max-w-6xl">
          <h3 className={`font-sans text-3xl md:text-5xl font-extrabold text-center mb-24 uppercase tracking-wide`}>
            ¡Descárgala ahora mismo!
          </h3>

          <section className="grid grid-cols-1 lg:grid-cols-2 scroll-animation" id="download">
            <div className="flex justify-center items-center flex-col text-center">
              <h3 className="text-3xl uppercase font-extrabold my-3">
                Para móviles
              </h3>
              <p className="text-lg">
                Nuestra aplicación se encuentra disponible tanto para Android como para iOS
              </p>
            </div>
            <div className="flex justify-center items-center">
              <Image src={mockup} alt="forenvent app" className="w-[250px]" />
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 py-6 scroll-animation">
            <div className="flex justify-center items-center">
              <Image src={mockup2} alt="forenvent app" className="w-[350px]" />
            </div>
            <div className="flex justify-center items-center flex-col text-center">
              <h3 className="text-3xl uppercase font-extrabold my-3">
                En tu zona
              </h3>
              <p className="text-lg">
                Nuestra aplicación muestra todos los eventos disponibles en una zona, ¡Incluyendo tu evento!. Además, se pueden ver los artistas disponibles en el evento, chatear con nuevas personas y comprar consumisiones; <span className="text-primary">todo desde la app de Forevent</span>
              </p>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 scroll-animation" id="download">
            <div className="flex justify-center items-center flex-col text-center">
              <h3 className="text-3xl uppercase font-extrabold my-3">
                Para móviles
              </h3>
              <p className="text-lg">
                Nuestra aplicación se encuentra disponible tanto para Android como para iOS
              </p>
            </div>
            <div className="flex justify-center items-center">
              <Image src={mockup3} alt="forenvent app" className="w-[600px]" />
            </div>
          </section>
        </div>
      </div>
    </>
  )

}
